# Emoji Dynamics Sandbox

An experimental physics sandbox that leverages WebGPU to simulate and render massive amounts of emoji entities at ultra-high speeds. 
Built with a "GPU-First" architecture, it handles everything from physical calculations and collision detection to entity life-cycle management entirely within the GPU, minimizing CPU overhead.

## 🚀 Key Features

- **Full GPU-Bound Physics**: Compute shaders handle collision detection, gravity, and state transitions for tens of thousands of entities simultaneously.
- **Spatial Hashing**: Efficient neighbor searching using a 128x128 grid, achieving near $O(1)$ collision detection performance.
- **Ping-Pong SoA Architecture**: Utilizes dual buffers (Source/Destination) that flip every frame to ensure stable, race-condition-free Jacobi iteration physics.
- **Ring Buffer Entry Management**: A fixed-size pool of 100,000 entities is managed as a ring buffer, allowing for infinite entity generation by overwriting old or deleted data without memory reallocation.
- **GPU Atomic Counter**: Real-time counting of alive entities directly within the Compute Shader, synchronized to the HUD via asynchronous GPU-to-CPU readback.
- **Zero-Lock (Terrain) System**: Stationary entities are "locked" into a terrain state, reducing computational load while allowing others to physically stack on top of them.

## 🎮 Controls

| Action | Control | Description |
| :--- | :--- | :--- |
| **Entropy Burst** | Left Click | Launches a shockwave from the mouse position, blasting emojis away. |
| **Black Hole** | Right Click / Shift + Left Click | Generates a powerful gravitational pull that sucks emojis into the cursor. |
| **Supernova** | Release Right Click | Releases condensed energy, causing a massive explosion that clears the area. |
| **Entity Control** | HUD Buttons | Add or remove entities in increments ranging from 10 to 10,000. |
| **ALL REMOVE** | Red Button | Instantly marks all entities as DEAD and clears the pool. |

## 🛠 Technical Specifications

- **Tech Stack**: HTML5, JavaScript (ES6+), WGSL (WebGPU Shading Language)
- **Architecture**: Universal Constrained Dynamics (UCD) inspired core
- **State Layout**: 
  - `pos`: `vec2<f32>`
  - `vel`: `vec2<f32>`
  - `packed_data`: `u32` (Bit 0-7: Emoji index, Bit 8-10: State [0:Active, 1:Zero-Lock, 2:DEAD])
- **Auto-Culling**: Entities that fly too far off-screen (±3000px) or encounter calculation errors (NaN) are automatically flagged as DEAD by the GPU and removed from the active count.

## ⚠️ Requirements

- **WebGPU Compatible Browser**: 
  - Google Chrome (Desktop)
  - Microsoft Edge (Desktop)
- **Hardware**: A GPU supporting WebGPU (Integrated graphics are sufficient for several thousand entities).

---

### Developer Notes
This system is designed for high-density stress testing of GPU compute capabilities. Under extreme pressure (such as within a Black Hole), repulsion forces are dynamically dampened to simulate fluid-like condensation, while the Jacobi solver ensures that the macro-behavior remains stable even at high entity counts.