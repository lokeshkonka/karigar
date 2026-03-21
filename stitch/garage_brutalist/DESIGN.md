# Design System: High-Octane Industrialism

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Blueprint Disruptor."** 

'MyGarage' is not a soft, consumer-facing social app; it is a high-utility, management powerhouse. We are moving away from the "polite" web of rounded corners and subtle blurs. Instead, we embrace a raw, editorial aesthetic that mirrors the physical nature of a garage: heavy tools, bold hazard lines, and uncompromising structural integrity. By combining high-contrast neubrutalism with a sophisticated off-white palette, we create an experience that feels like a premium automotive magazine meets a high-performance workshop manual. 

We break the "template" look through **Intentional Structural Weight**. While most modern systems hide their skeleton, we celebrate it. Every container is a definitive statement, and every interaction is a tactile mechanical click.

---

## 2. Colors & Surface Architecture

Our palette is built on high-contrast tension. The use of `#FFE500` (Electric Yellow) against `#1a1a1a` (Deep Carbon) evokes immediate authority and caution.

### The Palette (Material Mapping)
- **Primary:** `#6a5f00` | **Primary Container (Electric Yellow):** `#FFE500`
- **Background:** `#F5F0E8` (Off-white / Bone)
- **Surface:** `#1a1a1a` (Deep Carbon - Used for Sidebar and Heavy Contrast)
- **Secondary (Accent):** `#ff6b6b` (Warning Red)
- **Tertiary (Utility):** `#74B9FF` (Tool Blue)

### The "Iron-Clad" Rule
Prohibit 1px solid borders. In this system, boundaries are either **3px solid black (#1a1a1a)** or they do not exist. We do not use "soft" dividers. To separate content without a border, use a strict background shift from `surface-container-low` (#f6f3f2) to the `background` (#fcf9f8).

### Surface Hierarchy & Nesting
Treat the UI as a physical workbench. 
- **The Base:** The `background` (#F5F0E8) acts as the floor.
- **The Workstation:** Primary cards use `surface_container_lowest` (#ffffff) to pop against the bone background.
- **The Shadow:** Every card must feature a hard, 4px 4px 0px `#1a1a1a` drop shadow. No blur. This creates a "stacked sheet" effect that defines importance through physical offset rather than lighting.

---

## 3. Typography: Editorial Authority

The typography system is designed to scream. We utilize a mix of **Space Grotesk** for structural data and **Inter** for legibility, but the "Signature" comes from the Heading treatment.

- **Display & Headlines:** Must use **Space Grotesk** (Weight 900/Bold). 
  - *Styling:* ALL CAPS, +5% to +10% letter-spacing. 
  - *Intent:* This creates an architectural, stamped look reminiscent of industrial part numbers.
- **Body & Titles:** **Inter** is our workhorse. Use it for data density and long-form descriptions to ensure the neubrutalist edge doesn't sacrifice speed of use.
- **Labels:** **Space Mono** (Weight 700). Used for technical specs (e.g., VIN numbers, torque settings, dates) to give a "receipt-print" feel.

---

## 4. Elevation & Mechanical Depth

We reject the concept of "light and shadow" in favor of "thickness and stack."

- **The Layering Principle:** Depth is binary. An element is either on the page or "bolted" to it. Use the hard shadow (`4px 4px 0 #1a1a1a`) to indicate interactivity. If it has a shadow, it can be pressed.
- **Zero-Blur Policy:** Shadows are never diffused. This isn't ambient light; it's a structural offset. 
- **The "Mechanical Click" Interaction:** On `:active` states, the `box-shadow` of buttons and cards should transition to `1px 1px 0 #1a1a1a` with a `translate(2px, 2px)` transform. This mimics the physical compression of a button.
- **Strict Sharpness:** The `border-radius` token is locked at `0px` across the entire system. No exceptions. Rounded corners are for soft goods; 'MyGarage' is built of steel.

---

## 5. Components

### Buttons
- **Primary:** Background `#FFE500`, 3px border `#1a1a1a`, hard shadow `3px 3px 0 #1a1a1a`. Text: All Caps Space Grotesk.
- **Secondary:** Background `#ffffff`, 3px border `#1a1a1a`, hard shadow `3px 3px 0 #1a1a1a`.
- **Tertiary:** No background, 3px border `#1a1a1a`, no shadow.

### Input Fields
- **Container:** 3px solid black border, sharp corners.
- **Focus State:** Background shifts to `primary_container` (#FFE500). The cursor should be a thick black block.
- **Label:** Sits above the border in ALL CAPS Space Grotesk (label-md).

### Cards & Lists
- **No Dividers:** Lists do not use lines. They use `surface-container` color blocks or 8px vertical spacing increments. 
- **Inventory Cards:** Must feature a 3px border. High-priority items (e.g., "Vehicle Overdue Service") receive a `#FF6B6B` border instead of black.

### Status Badges
- **Style:** Flat fill (Success: Tool Blue, Warning: Electric Yellow, Error: Warning Red), 2px black border, sharp corners. Text must be bold Inter, sentence case.

### Garage-Specific Components
- **The "Diagnostic Strip":** A high-contrast vertical bar (3px black) on the left side of list items to denote categories (e.g., SUV, Sedan, Truck).
- **The "Part Counter":** A large Display-LG numeral in the corner of a card, overlapping the border slightly to break the grid.

---

## 6. Do's and Don'ts

### Do:
- **Use Asymmetry:** Place a button slightly off-center or allow a heading to bleed over a container edge.
- **Embrace White Space:** Use the `24` (6rem) spacing token between major sections to let the heavy borders breathe.
- **High Contrast:** Ensure all text on Yellow backgrounds is Pure Black (#1a1a1a) for AAA accessibility and visual punch.

### Don't:
- **No Gradients:** We use solid colors only. Visual "soul" comes from the tension of the layout, not color transitions.
- **No 1px Lines:** If it’s worth a line, it’s worth a 3px line.
- **No Softness:** Never use `border-radius`. Even the smallest 2px radius destroys the "Blueprint Disruptor" intent.
- **No "Grey":** Avoid mid-tone greys. Use either the bone off-white or the deep carbon black.