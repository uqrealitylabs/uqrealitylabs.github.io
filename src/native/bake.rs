//! Bake terrain positions and linear colours once, instead of resampling rivers on every page load

use serde_json::Value;
use std::{error::Error, fs, path::Path};

const SIDE: usize = 181;
const WATER_SIDE: usize = 513;

fn crossing(p: [f64; 2], sea: [f64; 2], a: [f64; 2], b: [f64; 2]) -> bool {
    let r = [sea[0] - p[0], sea[1] - p[1]];
    let s = [b[0] - a[0], b[1] - a[1]];
    let cross = |a: [f64; 2], b: [f64; 2]| a[0] * b[1] - a[1] * b[0];
    let denominator = cross(r, s);
    if denominator.abs() < 1e-15 {
        return false;
    }
    let delta = [a[0] - p[0], a[1] - p[1]];
    let t = cross(delta, s) / denominator;
    let u = cross(delta, r) / denominator;
    t > 0.0 && t < 1.0 && (0.0..1.0).contains(&u)
}

fn coordinate(v: &Value) -> Result<[f64; 2], Box<dyn Error>> {
    let p = [number(&v[0])?, number(&v[1])?];
    if p[0].abs() > 180.0 || p[1].abs() > 90.0 {
        return Err("Invalid geographic coordinate".into());
    }
    Ok(p)
}

struct Ring {
    points: Vec<[f64; 2]>,
    min: [f64; 2],
    max: [f64; 2],
}
impl Ring {
    fn new(points: Vec<[f64; 2]>) -> Self {
        let mut min = [f64::INFINITY; 2];
        let mut max = [f64::NEG_INFINITY; 2];
        for p in &points {
            for i in 0..2 {
                min[i] = min[i].min(p[i]);
                max[i] = max[i].max(p[i]);
            }
        }
        Self { points, min, max }
    }
    fn contains(&self, p: [f64; 2]) -> bool {
        p[0] >= self.min[0]
            && p[0] <= self.max[0]
            && p[1] >= self.min[1]
            && p[1] <= self.max[1]
            && contains(p, &self.points)
    }
}

fn rings(value: &Value) -> Result<Vec<Ring>, Box<dyn Error>> {
    let values = value.as_array().ok_or("Missing water rings")?;
    if values.len() > 2000 {
        return Err("Water ring budget exceeded".into());
    }
    values
        .iter()
        .map(|ring| {
            let points = ring.as_array().ok_or("Invalid water ring")?;
            if points.len() > 100000 {
                return Err("Water point budget exceeded".into());
            }
            points
                .iter()
                .map(coordinate)
                .collect::<Result<Vec<_>, _>>()
                .map(Ring::new)
        })
        .collect()
}

fn contains(p: [f64; 2], ring: &[[f64; 2]]) -> bool {
    let mut inside = false;
    for pair in ring.windows(2) {
        let [a, b] = [pair[0], pair[1]];
        if (a[1] > p[1]) != (b[1] > p[1])
            && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]
        {
            inside = !inside;
        }
    }
    inside
}

fn water(root: &Path, output: &Path, name: &str) -> Result<(), Box<dyn Error>> {
    let target = output.join(format!("{name}-water.bin"));
    let source = root.join(format!("{name}.json"));
    let elevation = root.join(format!("{name}-elevation.json"));
    let newest = fs::metadata(&source)?
        .modified()?
        .max(fs::metadata(&elevation)?.modified()?)
        .max(fs::metadata(std::env::current_exe()?)?.modified()?);
    if fs::metadata(&target).is_ok_and(|m| {
        m.len() == (WATER_SIDE * WATER_SIDE) as u64 && m.modified().is_ok_and(|t| t >= newest)
    }) {
        return Ok(());
    }
    let data: Value = serde_json::from_slice(&fs::read(source)?)?;
    let field: Value = serde_json::from_slice(&fs::read(elevation)?)?;
    let mut edges = Vec::new();
    let sea = if data["coasts"].is_array() {
        for coast in rings(&data["coasts"])? {
            edges.extend(coast.points.windows(2).map(|p| [p[0], p[1]]));
        }
        Some(coordinate(&data["sea"])?)
    } else {
        None
    };
    let lakes = data["water"].as_array().map_or(Ok(Vec::new()), |values| {
        if values.len() > 2000 {
            return Err("Water relation budget exceeded".into());
        }
        values
            .iter()
            .map(|value| Ok((rings(&value["outers"])?, rings(&value["inners"])?)))
            .collect::<Result<Vec<_>, Box<dyn Error>>>()
    })?;
    let west = number(&field["west"])?;
    let east = number(&field["east"])?;
    let north = number(&field["north"])?;
    let south = number(&field["south"])?;
    if east <= west || north <= south {
        return Err("Invalid water grid bounds".into());
    }
    let mut mask = vec![0; WATER_SIDE * WATER_SIDE];
    for row in 0..WATER_SIDE {
        for column in 0..WATER_SIDE {
            let p = [
                west + column as f64 / (WATER_SIDE - 1) as f64 * (east - west),
                north - row as f64 / (WATER_SIDE - 1) as f64 * (north - south),
            ];
            let ocean = sea.is_some_and(|sea| {
                edges
                    .iter()
                    .filter(|[a, b]| crossing(p, sea, *a, *b))
                    .count()
                    % 2
                    == 0
            });
            let lake = lakes.iter().any(|(outer, inner)| {
                outer.iter().any(|r| r.contains(p)) && !inner.iter().any(|r| r.contains(p))
            });
            mask[row * WATER_SIDE + column] = u8::from(ocean || lake);
        }
    }
    fs::write(target, mask)?;
    Ok(())
}

fn number(value: &Value) -> Result<f64, Box<dyn Error>> {
    value
        .as_f64()
        .filter(|v| v.is_finite())
        .ok_or_else(|| "Invalid terrain number".into())
}

fn local(point: &Value) -> Result<[f64; 2], Box<dyn Error>> {
    let [lon, lat] = coordinate(point)?;
    Ok([(lon - 153.01302) * 2469.0, -(lat + 27.4974) * 2783.0])
}

fn river_distance([x, z]: [f64; 2], [a, b]: &[[f64; 2]; 2]) -> f64 {
    let dx = b[0] - a[0];
    let dz = b[1] - a[1];
    let length = dx * dx + dz * dz;
    let t = if length > 0.0 {
        (((x - a[0]) * dx + (z - a[1]) * dz) / length).clamp(0.0, 1.0)
    } else {
        0.0
    };
    (x - a[0] - t * dx).powi(2) + (z - a[1] - t * dz).powi(2)
}

fn bake(root: &Path) -> Result<Vec<u8>, Box<dyn Error>> {
    let source: Value = serde_json::from_slice(&fs::read(root.join("elevation.json"))?)?;
    let width = source["width"].as_u64().ok_or("Missing width")? as usize;
    let height = source["height"].as_u64().ok_or("Missing height")? as usize;
    if width < 2 || height < 2 || width.checked_mul(height).is_none_or(|n| n > 100_000) {
        return Err("Grid budget exceeded".into());
    }
    let samples: Vec<f64> = source["samples"]
        .as_array()
        .ok_or("Missing samples")?
        .iter()
        .map(number)
        .collect::<Result<_, _>>()?;
    if samples.len() != width * height || samples.iter().any(|v| *v < -100.0 || *v > 2000.0) {
        return Err("Invalid elevation samples".into());
    }
    let west = number(&source["west"])?;
    let east = number(&source["east"])?;
    let south = number(&source["south"])?;
    let north = number(&source["north"])?;
    if east <= west || north <= south {
        return Err("Invalid geographic bounds".into());
    }
    let mut edges = Vec::new();
    for name in ["campus", "city"] {
        let data: Value = serde_json::from_slice(&fs::read(root.join(format!("{name}.json")))?)?;
        for river in data["rivers"].as_array().ok_or("Missing rivers")? {
            let points: Vec<[f64; 2]> = river
                .as_array()
                .ok_or("Invalid river")?
                .iter()
                .map(local)
                .collect::<Result<_, _>>()?;
            edges.extend(points.windows(2).map(|p| [p[0], p[1]]));
        }
    }
    let mut positions = Vec::with_capacity(SIDE * SIDE * 3);
    let mut colours = Vec::with_capacity(SIDE * SIDE * 3);
    for row in 0..SIDE {
        for column in 0..SIDE {
            let x = column as f64 * 2.0 - 180.0;
            let z = row as f64 * 2.0 - 255.0;
            let u = (((153.01302 + x / 2469.0) - west) / (east - west) * (width - 1) as f64)
                .clamp(0.0, (width - 1) as f64);
            let v = ((north - (-27.4974 - z / 2783.0)) / (north - south) * (height - 1) as f64)
                .clamp(0.0, (height - 1) as f64);
            let a = u.floor() as usize;
            let b = v.floor() as usize;
            let c = (a + 1).min(width - 1);
            let d = (b + 1).min(height - 1);
            let top =
                samples[b * width + a] * (1.0 - u.fract()) + samples[b * width + c] * u.fract();
            let bottom =
                samples[d * width + a] * (1.0 - u.fract()) + samples[d * width + c] * u.fract();
            let h = if edges
                .iter()
                .any(|edge| river_distance([x, z], edge) < 5.5_f64.powi(2))
            {
                0.0
            } else {
                (top * (1.0 - v.fract()) + bottom * v.fract()).max(0.0) / 40.0
            };
            positions.extend([x as f32, h as f32, z as f32]);
            let variation = (x * 0.035 + z * 0.02).sin() as f32 * 0.008;
            colours.extend([0.065 + variation, 0.105 + variation, 0.055 + variation]);
        }
    }
    Ok(positions
        .into_iter()
        .chain(colours)
        .flat_map(f32::to_le_bytes)
        .collect())
}

fn main() -> Result<(), Box<dyn Error>> {
    let mut args = std::env::args_os().skip(1);
    let source = args.next().ok_or("Missing source directory")?;
    let output = args.next().ok_or("Missing output directory")?;
    let bytes = bake(Path::new(&source))?;
    fs::create_dir_all(&output)?;
    fs::write(Path::new(&output).join("terrain.bin"), &bytes)?;
    for name in [
        "sydney",
        "melbourne",
        "canberra",
        "perth",
        "adelaide",
        "hobart",
        "darwin",
    ] {
        water(Path::new(&source), Path::new(&output), name)?;
    }
    println!(
        "Baked {} terrain vertices into {} bytes",
        SIDE * SIDE,
        bytes.len()
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn maps_sydney_harbour_without_flooding_the_cbd() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../public/assets/world");
        let output = root.join("../../../out/test-results/water");
        fs::create_dir_all(&output).expect("Test artefact directory");
        water(&root, &output, "sydney").expect("Bounded water raster");
        let mask = fs::read(output.join("sydney-water.bin")).expect("Water raster");
        let field: Value =
            serde_json::from_slice(&fs::read(root.join("sydney-elevation.json")).unwrap()).unwrap();
        let sample = |lon: f64, lat: f64| {
            let x = ((lon - field["west"].as_f64().unwrap())
                / (field["east"].as_f64().unwrap() - field["west"].as_f64().unwrap())
                * 512.0)
                .round() as usize;
            let y = ((field["north"].as_f64().unwrap() - lat)
                / (field["north"].as_f64().unwrap() - field["south"].as_f64().unwrap())
                * 512.0)
                .round() as usize;
            mask[y * WATER_SIDE + x]
        };
        assert_eq!(sample(151.2075, -33.87), 0);
        assert_eq!(sample(151.22, -33.85), 1);
    }
    #[test]
    fn bakes_finite_positions_and_clamps_river_segments() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../public/assets/world");
        let bytes = bake(&root).expect("Valid source terrain");
        assert_eq!(bytes.len(), SIDE * SIDE * 6 * 4);
        assert!(
            bytes
                .chunks_exact(4)
                .all(|b| f32::from_le_bytes(b.try_into().unwrap()).is_finite())
        );
        assert_eq!(river_distance([3.0, 4.0], &[[0.0, 0.0], [0.0, 1.0]]), 18.0);
        let square = [[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], [0.0, 0.0]];
        assert!(contains([0.5, 0.5], &square));
        assert!(!contains([2.0, 0.5], &square));
        assert!(crossing([0.0, 0.0], [2.0, 0.0], [1.0, -1.0], [1.0, 1.0]));
        assert!(!crossing([0.0, 0.0], [2.0, 0.0], [3.0, -1.0], [3.0, 1.0]));
        assert!(!crossing([0.0, 0.0], [2.0, 0.0], [0.0, 1.0], [2.0, 1.0]));
    }
}
