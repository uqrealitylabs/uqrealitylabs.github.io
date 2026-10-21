# World sources

## Geographic data

Campus and city footprints, paths, roads, parks, river centrelines and tree positions derive from OpenStreetMap
© OpenStreetMap contributors — https://www.openstreetmap.org/copyright
The derived databases are shared under ODbL 1.0 — https://opendatacommons.org/licenses/odbl/1-0/
Extracts retrieved through https://api.openstreetmap.org/api/0.6/map on 21 October 2026
Campus bounds: 153.005, -27.503, 153.022, -27.489
Brisbane bounds: 152.999, -27.485, 153.045, -27.447
The city extract retains 4,500 buildings and 13,111 road and path segments
The campus extract retains 1,173 buildings and 2,382 road and path segments
Missing or zero building heights use an interpretive default, not a verified measurement
River width and building façade details are interpretive
Forgan Smith tower and cloister detailing was informed by UQ's Great Court photographs and history
https://about.uq.edu.au/profile-rankings/history/great-court
The scene is an artistic interpretation, not a survey or wayfinding service

## Elevation

Mapzen Terrarium elevation tiles, sampled into a 161×161 local grid
https://registry.opendata.aws/terrain-tiles/
https://s3.amazonaws.com/elevation-tiles-prod/terrarium/12/{x}/{y}.png
Coverage: 152.94 to 153.085 E, −27.545 to −27.415 N
Tiles x 3788–3789 and y 2372–2374
Source attribution and underlying elevation licences: https://github.com/tilezen/joerd/blob/master/docs/attribution.md
Elevations are interpreted in metres at forty metres per scene unit, with a flattened river channel

## Transport

Translink South East Queensland static GTFS, retrieved 21 October 2026
https://gtfsrt.api.translink.com.au/GTFS/SEQ_GTFS.zip
https://translink.com.au/about-translink/open-data
Route shapes M1, M2, 192 and F1 are retained
Vehicle positions are illustrative and move with camera travel, not a real-time service
Creative Commons Attribution 4.0 — https://creativecommons.org/licenses/by/4.0/
Credit Translink, Queensland Department of Transport and Main Roads

## Earth imagery

NASA Blue Marble, Land Surface, Shallow Water and Shaded Topography
https://visibleearth.nasa.gov/images/57752/blue-marble-land-surface-shallow-water-and-shaded-topography
https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57752/land_shallow_topo_2048.jpg
Credit NASA Goddard Space Flight Center
Public-domain NASA imagery supplied as a 2048×1024 WebP derivative

## Materials

Sandstone diffuse colour and OpenGL normal derive from Poly Haven Sandstone Blocks 04
https://polyhaven.com/a/sandstone_blocks_04
CC0 — https://polyhaven.com/license
The scene uses compressed WebP derivatives

## Scene posters

The four campus and Australia covers are captures of this repository's live Three world
Desktop viewport 1440×1000, resized to 1280 px wide
Mobile viewport 390×844, retained at 780 px wide for high-density displays
They use the same camera, geometry, materials and lights as the live scene
Recapture them after camera, geography or material changes

## Detailed city geometry

Queensland Government Brisbane buildings, LiDAR captured in 2014
https://www.arcgis.com/home/item.html?id=e1a0e12f02e8403aa7dbc37724aa32b2
https://services1.arcgis.com/HrMiNYsSqqPpLTDE/arcgis/rest/services/Brisbane_buildings/SceneServer/layers/0
CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/
Converted from 41 I3S nodes to a local-coordinate GLB with vertex colours and Meshopt compression
The source covers the CBD and northern inner suburbs, not St Lucia, and predates newer developments
Campus façades remain photo-informed interpretations of mapped footprints, not survey-grade or photogrammetric meshes
The separately located SISP photogrammetry was excluded because its redistribution terms do not permit this repository to distribute it

## Tree models

Poly Haven Jacaranda Tree and Island Tree 01, CC0
https://polyhaven.com/a/jacaranda_tree
https://polyhaven.com/a/island_tree_01
https://polyhaven.com/license
Compressed, simplified, WebP-textured GLB derivatives with Meshopt WASM decoding
Mapped jacarandas use the jacaranda model; unclassified trees use a representative branched broadleaf specimen
Mapped positions are real, but unknown species and individual crown geometry are not verified against a UQ tree survey
Farther trees use simplified versions of the same models

## Night, weather and live transport

NASA Earth Observatory, Earth at Night, 2012 Suomi NPP VIIRS derivative
https://earthobservatory.nasa.gov/features/NightLights
https://eoimages.gsfc.nasa.gov/images/imagerecords/79000/79765/dnb_land_ocean_ice.2012.3600x1800.jpg
Credit NASA Earth Observatory / NOAA / Department of Defense
The night image is a historical light composite, not a live satellite image
The solar direction follows UTC; local street lamps use the available OSM mapped positions, whose coverage is incomplete

Open-Meteo current modelled conditions for St Lucia and Brisbane
https://open-meteo.com/en/docs
CC BY 4.0 — https://open-meteo.com/en/terms
Local weather is refreshed every 15 minutes while the scene is visible

OpenSky Network anonymous aircraft state vectors
https://opensky-network.org/data/api
Attribution: The OpenSky Network, https://opensky-network.org
Source snapshots are cached for at least 240 seconds to respect anonymous request limits
OpenSky data use is subject to its public non-commercial API terms; review provider access before any commercial use

Translink SEQ real-time ferry vehicle positions
https://gtfsrt.api.translink.com.au/api/realtime/SEQ/VehiclePositions/Ferry
https://translink.com.au/about-translink/open-data
CC BY 4.0, Translink, Queensland Department of Transport and Main Roads
Ferry snapshots are cached for at least 60 seconds
Aircraft and ferries are placed at their reported coordinates, with timestamps and delayed/unavailable states
This is not general AIS ship coverage or a navigation service
Bus and Metro motion follows static route shapes and is illustrative

Leaf cutout masks are embedded into the GLB base-colour textures so canopy coverage survives the WebGPU material conversion

## Capital districts and authored landmarks

Sydney, Melbourne, Canberra, Perth, Adelaide, Hobart and Darwin use separate OSM building/road/park/water extracts
Source queries use the public Overpass API, https://overpass-api.de/api/interpreter
© OpenStreetMap contributors, ODbL 1.0, https://www.openstreetmap.org/copyright
The machine-generated extracts retain real footprints and available heights, with height estimates where OSM lacks measurements
They contain up to 8,000 buildings and 20,000 road/path segments per capital and load only after a fly-in request
Mapzen Terrarium elevation tiles provide local hills, https://registry.opendata.aws/terrain-tiles/
The authored landmark silhouettes are approximate geometry, not measured façades, survey meshes or photogrammetry
Coastlines, waterfront polygons, roof forms, current building heights and individual tree species remain incomplete
No unlicensed ArcGIS or commercial city mesh is redistributed

The Parnell façade study used the Wikimedia Commons photograph “Parnell Building surrounding the Great Court, University of Queensland”, CC BY-SA 4.0
https://commons.wikimedia.org/wiki/File:Parnell_Building_surrounding_the_Great_Court,_University_of_Queensland.jpg
The photograph informs the arcade and Helidon freestone palette and is not packaged as a site texture

AISstream optional server-side position reports
https://aisstream.io/documentation
Requires a free provider account and a server-side key, not provisioned or verified here
The adapter maintains one compressed, geographically restricted stream while visitors request it, with bounded records and stale-position removal
OpenSky client-credentials authentication is optional and keeps tokens and secrets on the server
No aircraft or ship coverage is claimed where provider access is unavailable

Coastal districts also retain sourced OSM coastline ways and joined water multipolygons
Rust rasterises ocean, harbour and lake coverage with inner island rings into cached masks before the site build
Known open-water anchors are kept with destination metadata in world.toml
Production browser JSON omits the shoreline source geometry after baking
The Sydney regression fixture distinguishes the CBD from open harbour water
The mask resolution is about 40–50 metres in these extracts and does not establish survey accuracy
