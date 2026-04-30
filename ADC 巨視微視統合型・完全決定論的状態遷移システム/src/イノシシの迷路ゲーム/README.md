# Boar Maze Game
### 🐗 Macro-Micro Integrated Deterministic State Transition System

A high-fidelity maze puzzle game where players guide a straight-running boar to the goal using apples and temporal manipulation.

## 🛠 Technical Architecture (ADC Compliance)

This project is built using the **Axiom Dynamics Core (ADC)**[cite: 1, 2], integrating several specialized sub-frameworks to ensure deterministic behavior and rich perceptual feedback.

### 1. CVD (Cyclic Velocity Dynamics)
The boar's movement is governed by a **Drive/Rest** phase model[cite: 3]. 
- **Drive Phase:** High-velocity linear progression triggered by an apple detection.
- **Rest Phase:** Zero-velocity state upon collision or manual stop.
- **Velocity Level:** Fixed at a base intensity of 380, influenced by local time dilation[cite: 3].

### 2. CVM (Cyclic Velocity Model)
The game lifecycle is managed through state transitions[cite: 4]:
- **Birth/Growth:** Stage initialization and map generation.
- **Maturity:** Active gameplay loop.
- **Death (Maximization):** Successful goal reach (🏁).
- **Standby:** State between stages or reset during failure.

### 3. FBM (Field-Boundary Mechanics)
The environment uses a **Hash-Grid Chunk SDF** approach[cite: 2, 5]:
- **SDF (Signed Distance Functions):** Used for rigid collision detection between the boar and maze walls.
- **Entropy Discharge:** Visual dust particles and impact effects are treated as field fluctuations resulting from state transitions[cite: 5].

### 4. IPDF (Imaginary Phase Dynamics Framework)
Used for **Future Trajectory Prediction**[cite: 6]:
- Before a "Drive" phase begins, the system calculates the deterministic collision point (Target) on the complex phase plane to prevent "Overshooting" or clipping into boundaries[cite: 2, 6].

### 5. PDE (Perceptual Dynamics Engine)
Translates internal logic into intuitive UX[cite: 2, 8]:
- **Time Dilation:** Long-pressing the screen triggers a local $dt$ reduction (Slow Motion).
- **Haptic Visuals:** Camera shakes and impact particles are normalized to 10 activity levels to signify intensity[cite: 8].
- **Confused Phase:** A post-slow-motion state where the boar displays a `?` mark, simulating a phase recovery delay.

---

## 🎮 How to Play

1. **Placement:** Click/Tap on the floor to place an 🍎. The boar will only charge if it has a direct line of sight.
2. **The Charge:** The boar runs in a straight line until it hits a wall or the apple.
3. **Temporal Control:** 
   - **Hold** during a charge to trigger **Time Dilation (Slow Motion)**.
   - **Release** to force the boar into an immediate **Rest Phase (Stop)**.
4. **Goal:** Reach the 🏁 to advance to the next stage.

---

## 📈 Stage Progression
- **Stages 1-5:** Hand-crafted tutorial levels.
- **Stages 6-20:** Procedural maze generation using **Dynamic Grid Alignment**. The field expands by 2 units per stage to increase spatial entropy[cite: 2].

---

## 🚀 Implementation Details
- **Engine:** Vanilla JavaScript / HTML5 Canvas.
- **Determinism:** All physics calculations use fixed delta time ($dt$) clamping to ensure consistent behavior across different hardware[cite: 2, 3].
- **Mobile Optimization:** Responsive canvas scaling and `PointerEvents` for unified touch/mouse interaction.

---
*Developed as part of the Axiom Dynamics Core (ADC) Research Project.*This README explains the technical architecture and implementation of the **Boar Maze Game**, developed under the **Axiom Dynamics Core (ADC)** framework.

---

# Boar Maze Game
### 🐗 Macro-Micro Integrated Deterministic State Transition System

A high-fidelity maze puzzle game where players guide a straight-running boar to the goal using apples and temporal manipulation.

## 🛠 Technical Architecture (ADC Compliance)

This project is built using the **Axiom Dynamics Core (ADC)**[cite: 1, 2], integrating several specialized sub-frameworks to ensure deterministic behavior and rich perceptual feedback.

### 1. CVD (Cyclic Velocity Dynamics)
The boar's movement is governed by a **Drive/Rest** phase model[cite: 3]. 
- **Drive Phase:** High-velocity linear progression triggered by an apple detection.
- **Rest Phase:** Zero-velocity state upon collision or manual stop.
- **Velocity Level:** Fixed at a base intensity of 380, influenced by local time dilation[cite: 3].

### 2. CVM (Cyclic Velocity Model)
The game lifecycle is managed through state transitions[cite: 4]:
- **Birth/Growth:** Stage initialization and map generation.
- **Maturity:** Active gameplay loop.
- **Death (Maximization):** Successful goal reach (🏁).
- **Standby:** State between stages or reset during failure.

### 3. FBM (Field-Boundary Mechanics)
The environment uses a **Hash-Grid Chunk SDF** approach[cite: 2, 5]:
- **SDF (Signed Distance Functions):** Used for rigid collision detection between the boar and maze walls.
- **Entropy Discharge:** Visual dust particles and impact effects are treated as field fluctuations resulting from state transitions[cite: 5].

### 4. IPDF (Imaginary Phase Dynamics Framework)
Used for **Future Trajectory Prediction**[cite: 6]:
- Before a "Drive" phase begins, the system calculates the deterministic collision point (Target) on the complex phase plane to prevent "Overshooting" or clipping into boundaries[cite: 2, 6].

### 5. PDE (Perceptual Dynamics Engine)
Translates internal logic into intuitive UX[cite: 2, 8]:
- **Time Dilation:** Long-pressing the screen triggers a local $dt$ reduction (Slow Motion).
- **Haptic Visuals:** Camera shakes and impact particles are normalized to 10 activity levels to signify intensity[cite: 8].
- **Confused Phase:** A post-slow-motion state where the boar displays a `?` mark, simulating a phase recovery delay.

---

## 🎮 How to Play

1. **Placement:** Click/Tap on the floor to place an 🍎. The boar will only charge if it has a direct line of sight.
2. **The Charge:** The boar runs in a straight line until it hits a wall or the apple.
3. **Temporal Control:** 
   - **Hold** during a charge to trigger **Time Dilation (Slow Motion)**.
   - **Release** to force the boar into an immediate **Rest Phase (Stop)**.
4. **Goal:** Reach the 🏁 to advance to the next stage.

---

## 📈 Stage Progression
- **Stages 1-5:** Hand-crafted tutorial levels.
- **Stages 6-20:** Procedural maze generation using **Dynamic Grid Alignment**. The field expands by 2 units per stage to increase spatial entropy[cite: 2].

---

## 🚀 Implementation Details
- **Engine:** Vanilla JavaScript / HTML5 Canvas.
- **Determinism:** All physics calculations use fixed delta time ($dt$) clamping to ensure consistent behavior across different hardware[cite: 2, 3].
- **Mobile Optimization:** Responsive canvas scaling and `PointerEvents` for unified touch/mouse interaction.

---
*Developed as part of the Axiom Dynamics Core (ADC) Research Project.*