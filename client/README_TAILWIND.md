# Using Tailwind CSS in CivicConnect

Tailwind CSS is installed and configured in this project. You can use it alongside MUI or for new components.

## Setup (already done)

- **tailwind.config.js** – content paths include `./index.html` and `./src/**/*.{js,ts,jsx,tsx}`. Custom `primary` and `fontFamily` are extended.
- **postcss.config.js** – runs `tailwindcss` and `autoprefixer`.
- **src/styles/global.css** – includes `@tailwind base; @tailwind components; @tailwind utilities;` and a small `@layer base` for body/fonts. Preflight is **disabled** so MUI and Tailwind don’t conflict.

## Using Tailwind in components

Use the `className` prop with Tailwind utility classes:

```jsx
// Example: Tailwind-only section
export function StatusBadge({ status }) {
  const classes = {
    submitted: "bg-blue-100 text-blue-800",
    in_progress: "bg-amber-100 text-amber-800",
    resolved: "bg-green-100 text-green-800",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-sm font-medium ${classes[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

// Layout / spacing
<div className="flex min-h-screen flex-col bg-slate-50">
  <header className="flex items-center justify-between px-4 py-3 md:px-6">
    <h1 className="text-xl font-bold text-primary">CivicConnect</h1>
  </header>
  <main className="flex-1 p-4 md:p-6">
    {children}
  </main>
</div>
```

## Tips

- **Responsive:** Use `sm:`, `md:`, `lg:` (e.g. `md:flex-row`, `sm:p-6`).
- **Colors:** `primary`, `primary-light`, `primary-dark` are defined in the config; otherwise use Tailwind’s slate, teal, etc.
- **MUI + Tailwind:** You can use both. Prefer Tailwind for new layout and utilities; keep MUI for complex components (Dialog, DataGrid, etc.) if needed.
- **Build:** `npm run build` compiles Tailwind and only includes classes that appear in your source (content paths in `tailwind.config.js`).

## Run

```bash
npm run dev
```

Then use any Tailwind class in `.jsx`/`.tsx` files under `src/`.
