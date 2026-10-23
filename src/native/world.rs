//! Bounded glTF inspection runs inside the model worker before GPU allocation

use gltf::{Gltf, Semantic, buffer, image};
use wasm_bindgen::prelude::*;

fn inspect(bytes: &[u8]) -> Result<u32, String> {
    if bytes.len() < 20 || bytes.len() > 8_000_000 || &bytes[..4] != b"glTF" {
        return Err("Invalid GLB size or header".into());
    }
    // Meshopt extensions are decoded by the shared WASM decoder after structural inspection
    let asset = match Gltf::from_slice(bytes) {
        Ok(asset) => asset,
        Err(gltf::Error::Validation(issues))
            if issues.iter().all(|(path, error)| {
                let path = path.to_string();
                (path.starts_with("extensionsRequired")
                    && matches!(error, gltf::json::validation::Error::Unsupported))
                    || (path.starts_with("textures[")
                        && path.ends_with(".source")
                        && matches!(error, gltf::json::validation::Error::Missing))
            }) =>
        {
            Gltf::from_slice_without_validation(bytes).map_err(|e| e.to_string())?
        }
        Err(error) => return Err(error.to_string()),
    };
    let doc = &asset.document;
    if doc.meshes().len() == 0
        || doc.meshes().len() > 256
        || doc.nodes().len() > 4096
        || doc.accessors().len() > 4096
        || doc.images().len() > 64
    {
        return Err("GLB object budget exceeded".into());
    }
    if doc
        .buffers()
        .any(|b| !matches!(b.source(), buffer::Source::Bin))
        || doc
            .images()
            .any(|i| !matches!(i.source(), image::Source::View { .. }))
    {
        return Err("Model resources must be embedded".into());
    }
    for texture in doc.textures() {
        let webp = texture
            .extension_value("EXT_texture_webp")
            .ok_or("Packaged model textures must use WebP")?;
        let source = webp
            .get("source")
            .and_then(|v| v.as_u64())
            .ok_or("Missing WebP image")?;
        if source >= doc.images().len() as u64 {
            return Err("WebP image index exceeds image data".into());
        }
    }
    let binary = asset.blob.as_ref().ok_or("Missing binary chunk")?;
    if doc.extensions_required().any(|name| {
        !matches!(
            name,
            "EXT_meshopt_compression"
                | "EXT_texture_webp"
                | "KHR_mesh_quantization"
                | "KHR_texture_transform"
                | "KHR_materials_ior"
                | "KHR_materials_specular"
        )
    }) {
        return Err("Unsupported required model extension".into());
    }
    for view in doc.views() {
        if view
            .offset()
            .checked_add(view.length())
            .is_none_or(|end| end > view.buffer().length())
        {
            return Err("Buffer view exceeds declared data".into());
        }
        if let Some(compressed) = view.extension_value("EXT_meshopt_compression") {
            let offset = compressed
                .get("byteOffset")
                .and_then(|v| v.as_u64())
                .unwrap_or(0);
            let length = compressed
                .get("byteLength")
                .and_then(|v| v.as_u64())
                .ok_or("Missing compressed length")?;
            let buffer = compressed
                .get("buffer")
                .and_then(|v| v.as_u64())
                .ok_or("Missing compressed buffer")?;
            if buffer != 0
                || offset
                    .checked_add(length)
                    .is_none_or(|end| end > binary.len() as u64)
            {
                return Err("Compressed view exceeds binary data".into());
            }
        }
    }
    let mut vertices = 0_u32;
    for primitive in doc.meshes().flat_map(|mesh| mesh.primitives()) {
        let position = primitive
            .get(&Semantic::Positions)
            .ok_or("Missing model positions")?;
        let count = u32::try_from(position.count()).map_err(|_| "Vertex count overflow")?;
        vertices = vertices.checked_add(count).ok_or("Vertex count overflow")?;
        if vertices > 2_000_000 {
            return Err("Model vertex budget exceeded".into());
        }
    }
    Ok(vertices)
}

/// Inspect an embedded GLB without creating renderer objects on the interaction thread
#[wasm_bindgen]
pub fn inspect_glb(bytes: &[u8]) -> Result<u32, JsValue> {
    inspect(bytes).map_err(|message| JsValue::from_str(&message))
}

#[cfg(test)]
mod tests {
    use super::inspect;
    use std::{fs, path::Path};

    #[test]
    fn accepts_world_assets_and_rejects_truncation_and_budgets() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../public/assets/world");
        for name in ["tree", "tree-far", "jacaranda", "jacaranda-far", "brisbane"] {
            let bytes = fs::read(root.join(format!("{name}.glb"))).expect("Checked-in model");
            assert!(inspect(&bytes).expect("Valid bounded model") > 0);
            assert!(inspect(&bytes[..20]).is_err());
        }
        assert!(inspect(&[]).is_err());
        assert!(inspect(&vec![0; 8_000_001]).is_err());
    }
}
