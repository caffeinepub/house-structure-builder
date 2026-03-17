# House Structure Builder

## Current State
New project, no existing code.

## Requested Changes (Diff)

### Add
- Interactive 2D house structure visualizer
- Room builder: add rooms (bedroom, kitchen, bathroom, living room, etc.) to a grid-based floor plan
- Drag-and-place room blocks on a canvas grid
- Room labels and color coding by room type
- House stats panel: total rooms, total area
- Ability to clear/reset the floor plan
- Predefined house templates (1BHK, 2BHK, 3BHK)

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: Store house plans (rooms, positions, dimensions) in Motoko
2. Frontend: Canvas-based grid where users place rooms by clicking/dragging
3. Room palette sidebar with room types (Living Room, Bedroom, Kitchen, Bathroom, Garage, Garden)
4. Each room type has a distinct color and default size
5. Click on grid to place selected room, click placed room to remove it
6. Top stats bar showing room count and total area
7. Template buttons to load predefined layouts
8. Save/reset controls
