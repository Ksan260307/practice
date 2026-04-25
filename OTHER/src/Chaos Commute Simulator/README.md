# UCD-F & IPDF City Car Simulation

A high-performance, browser-based 2D city traffic simulator utilizing advanced mathematical modeling for entity behavior and optimization. This project demonstrates the integration of the **ABC Model** for autonomous logic and the **Imaginary Phase Dynamics Framework (IPDF)** for complex agent interaction.

## ## Key Frameworks & Logic

### 1. UCD-F Engine (Unit-Coordinate Dynamics Framework)
The simulation is built on a custom **UCD-F engine**, which focuses on high-density entity management through:
* **Bit-packed SoA (Structure of Arrays):** Maximizes cache efficiency and memory layout by using `TypedArrays` (`Int32Array`, `Uint8Array`) to handle up to 5,000 active entities.
* **Fixed-Point Arithmetic:** Uses bit-shifting (`FP_SHIFT: 16`) for coordinate and velocity calculations to ensure deterministic movement and high-speed processing without floating-point overhead.
* **Spatial Hashing:** Implements a localized grid-based search to handle collisions and neighbor awareness with $O(1)$ lookup complexity for nearby cars.

### 2. ABC Model (Autonomous Behavior Core)
Each vehicle operates on an **ABC logic** cycle:
* **A (Explore):** Standard driving behavior, maintaining lane discipline and speed.
* **B (Adapt):** Reactive state where cars adjust to traffic lights, intersections, and lane changes.
* **C (Safe Drift/Halt):** Emergency or regulatory states, such as stopping at red lights or performing "Safe Drift" to avoid accidents.

### 3. IPDF (Imaginary Phase Dynamics Framework)
IPDF introduces "psychological" and "structural" phases to the agents, moving beyond simple pathfinding:
* **Frustration Metric:** Continuous idling at intersections increases an agent's internal frustration value.
* **Rogue State:** When frustration exceeds a threshold, an agent enters a "Rogue" phase, ignoring traffic laws, increasing speed, and potentially causing collisions.
* **Zero-Lock Dynamics:** Represents permanent state changes (accidents). When collisions occur, entities transition to a "Wreck" state, becoming static terrain obstacles that other agents must dynamically navigate around using IPDF avoidance logic.

---

## ## Features

* **Massive Entity Support:** Smoothly simulates up to **5,000 cars** simultaneously using LOD (Level of Detail) management.
* **Emergent Behavior:** Watch as traffic jams form naturally, "rogue" drivers weave through lanes, and accidents cause temporary gridlock.
* **Dynamic UI:** Real-time statistics tracking the distribution of agent phases (Explore, Adapt, Safe Drift, Rogue).
* **Canvas Optimization:** Utilizes off-screen canvas pre-rendering for city backgrounds and emoji-based car sprites for zero-latency drawing.

---

## ## Technical Implementation Details

| Component | Technology |
| :--- | :--- |
| **Rendering** | HTML5 Canvas (2D Context) |
| **Data Structure** | SoA (Structure of Arrays) using `SharedArrayBuffer` logic |
| **Physics** | Fixed-point math with bitwise operations |
| **AI/Logic** | ABC Model + IPDF (Phase-based state machine) |
| **UI** | Semi-transparent HUD with real-time DOM updates |

---

## ## How to Use

1.  Open the `index.html` file in any modern web browser.
2.  **Traffic Volume Slider:** Adjust the number of vehicles on screen (0 to 5,000).
3.  **Clear All Cars:** Reset the simulation state.
4.  **Observation:**
    * **Green/Yellow/Red indicators** on cars represent their current IPDF risk assessment.
    * **Purple indicators** represent "Rogue" agents.
    * **💥 (Wreck)** icons indicate a "Zero-Lock" accident site.

## ## Project Philosophy
> "AI development is stronger when focusing on **Structure** rather than just **Output Randomness**." 

This simulation proves that complex, organic-feeling traffic patterns can emerge from rigid mathematical structures and phase-based logic rather than heavy machine learning models.
