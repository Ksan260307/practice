# Axiom Dynamics Core (ADC)
**Macro-Micro Integrated Deterministic State Transition System**

Axiom Dynamics Core (ADC) is a massive parallel simulation environment designed to evolve heuristic-based agents in a strictly deterministic space. It orchestrates up to 10,000 individual logic instances, utilizing genetic weight optimization and time-dilation mechanics.

## 🌌 Overview
ADC is not just a game; it is a telemetry-driven evolution sandbox. Every instance operates as an autonomous agent with its own "genes"—weights that determine how it evaluates the board. Through a process of selection and mutation (RCM), the system evolves a "Global Fitness" to solve the entropy problem within the grid.

## 🚀 Key Features
* **Massive Parallelism**: Efficiently manages 1,000+ active instances using high-performance Typed Arrays (`Int8Array`, `Uint32Array`).
* **Shadow Phase Reversal**: A 600-frame deterministic rollback system allowing users to "time travel" and observe previous states or alter the future.
* **IPDF (Imaginary Phase Dynamics Framework)**: Real-time telemetry monitoring global tick, fitness, and entropy.
* **VIF Time Dilation**: Dynamic control over the "Velocity" of experience, ranging from slow-motion analysis to hyper-speed warping.
* **Permanent Death Mode**: Once an instance reaches a critical entropy state (Game Over), it enters a permanent rest state, highlighting the survival of the fittest.
* **Genetic Evolution (RCM)**: New instances inherit and mutate genes from the most successful "Alpha" instance in the population.

## 🛠 Technical Architecture
* **Core Logic**: Pure Vanilla JavaScript with a custom-built deterministic engine.
* **Rendering**: Direct pixel manipulation via HTML5 Canvas `ImageData` for high-frequency updates.
* **Styling**: Tailwind CSS for a futuristic, HUD-inspired interface.
* **Memory Management**: Byte-level data management for state saving and restoration.

## 🎮 Controls
* **Velocity Slider**: Adjust the simulation speed. Level 9+ enables "Warp Mode" for instant calculation.
* **Active Instances**: Dynamically scale the deployment area.
* **Phase Jump**: Roll back the entire universe by 1 or 10 seconds.
* **Deep Observation**: Click on any grid to enter "Focus Mode" and inspect an agent's ID, fitness, and genetic weights.
