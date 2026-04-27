# Axiom Universe - Celestial Observation Simulator

A 3D cosmic sandbox that visualizes the **Imaginary Phase Dynamics Framework (IPDF)** through the lens of stellar evolution and relativistic interference. In this universe, "time" is not a constant but a local variable influenced by the waves emitted by neighboring stars.

## Overview

Axiom Universe is an interactive simulation where stars (entities) undergo a continuous lifecycle—from Birth to Completion—within a dynamic space-time grid. The simulation uses **Three.js** to render a 3D environment where spatial fluctuations (FBM layer) directly dictate the "tempo" of reality for each celestial body.

## Key Concepts

### 1. Relativistic Time Dilation (New Interpretation)
Each star emits waves that interfere with its neighbors. According to the internal logic:
* **Constructive Interference (Wave Peaks)**: Accelerates local time.
* **Destructive Interference (Wave Troughs)**: Decelerates local time.
This results in stars in "crowded" or high-energy regions aging and pulsing at different rates compared to isolated ones.

### 2. Cyclic Velocity Model (CVM) Lifecycle
Every star progresses through a multi-stage lifecycle represented by color and scale transitions:
* **Birth (Green)**: The emergence of energy.
* **Growth (Blue)**: Expansion and stabilization.
* **Maturity (Yellow)**: Peak intensity and optionality.
* **Transition (Red)**: Shift in state entropy.
* **Completion (White)**: Degeneration into a compact state.
* **Standby (Black)**: Quiescent phase before potential rebirth.

### 3. Spatial Fluctuation (FBM Layer)
The underlying grid represents the fabric of space. It reacts in real-time to the mass and phase of every star, creating a visual representation of how energy distorts the environment.

## Controls

The **Observation Controller** allows users to manipulate the fundamental constants of this universe:
* **Time (Tempo)**: Scales the global clock, affecting the speed of lifecycles.
* **Wave (Fluctuation)**: Adjusts the intensity of spatial interference and its impact on local time.
* **Gravity**: Controls the subtle attraction forces between stars, leading to the formation of clusters.

## Technical Stack

* **Rendering**: Three.js (WebGL) with Fog and Point Cloud Grid.
* **UI**: Tailwind CSS with a blur-filter HUD for a futuristic aesthetic.
* **Optimization**: Mobile-friendly pixel ratio scaling and efficient entity management for smooth 60FPS performance on most devices.

## Implementation Notes

The system distinguishes between **Public Terminology** (UI-facing) and **Core Logic** (Internal):
* **Public**: "Stellar Gravity", "Tempo", "Waves".
* **Core**: ADC (Autonomous Decision Core) principles, Phase Dynamics, and Lifecycle Indexing.
