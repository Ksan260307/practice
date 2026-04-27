# ADC x IPDF: 1000 Cores with Temporal Reversal

A high-performance, parallel autonomous solver simulation featuring 1,000 independent processing cores. This engine utilizes the **Imaginary Phase Dynamics Framework (IPDF)** to execute predictive decision-making and real-time causality manipulation.

## Overview

This project is a web-based sandbox that visualizes the collective intelligence of 1,000 autonomous agents. Each core runs an optimized heuristic-based solver to manage state entropy while navigating a competitive environment where cleared lines are converted into "garbage" data and sent to other cores.

## Key Features

* **1,000 Parallel Autonomous Cores**: Massive scale simulation running in a single browser window using efficient typed arrays (`BigUint64Array`).
* **Temporal Reversal (Rewind)**: A sophisticated history buffer system that allows users to reverse causality and undo system entropy in real-time.
* **Active Hold Logic**: Agents evaluate not only the current state but also "potential futures" to decide when to swap the active piece for maximum survival efficiency.
* **Dynamic Time Dilation**: Adjust the simulation speed from 0.1x to 100x to observe macro-scale patterns or micro-scale logic.
* **Focus Observation Mode**: Select any individual core to monitor its specific entropy levels, target actions, and phase modes (Exploring, Survival, Adaptation, or Efficient).

## Technical Architecture

### Core Logic: IPDF Engine
The **IPDF (Imaginary Phase Dynamics Framework)** evaluates the board state based on four primary metrics:
1.  **Landing Height**: Minimizing the vertical stack.
2.  **Lines Cleared**: Maximizing throughput and garbage generation.
3.  **Hole Count**: Reducing structural entropy (trapped empty spaces).
4.  **Bumpiness**: Maintaining a flat landscape for higher optionality.

### Temporal Buffer System
The system maintains a `MAX_HISTORY` buffer of global snapshots. When "Rewind" is triggered, the engine restores previous states of both the shared `boardData` and individual core metadata, effectively scrolling back the timeline.

## Controls

* **Time Dilation Slider**: Adjust the simulation frequency.
* **Rewind Button**: Hold to trigger causality reversal.
* **Grid Interaction**: Click on any small grid (core) to focus the Intelligence Monitor on that specific agent.

## Implementation Details

* **Styling**: Tailwind CSS for a high-tech HUD interface.
* **Graphics**: Dual-layered HTML5 Canvas (Global Grid View & Focused Detail View).
* **Performance**: Optimized for 60FPS even with 1,000 active agents by utilizing Structure of Arrays (SoA) principles and minimal DOM updates.

---

> **Note**: This system is designed for high-load stress testing of browser-based logic engines. Core survival is dependent on the balanced distribution of generated "garbage" lines between agents.