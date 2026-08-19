import * as THREE from "three";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function dish(
  ctx: CanvasRenderingContext2D,
  y: number,
  name: string,
  desc: string,
  price: string,
  swatch: string,
  badge?: string,
) {
  roundRect(ctx, 36, y, 440, 132, 14);
  ctx.fillStyle = "#1E1E1E";
  ctx.fill();

  roundRect(ctx, 48, y + 14, 104, 104, 10);
  ctx.fillStyle = swatch;
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(48, y + 14, 104, 18);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillText(name, 172, y + 42);

  ctx.fillStyle = "#A0A0A0";
  ctx.font = "400 15px system-ui, sans-serif";
  ctx.fillText(desc, 172, y + 68);

  ctx.fillStyle = "#D35427";
  ctx.font = "600 20px system-ui, sans-serif";
  ctx.fillText(price, 172, y + 104);

  if (badge) {
    ctx.fillStyle = "#D35427";
    roundRect(ctx, 330, y + 22, 128, 26, 6);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.fillText(badge, 344, y + 40);
  }
}

export function createMenuTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1100;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D indisponível");
  }

  ctx.fillStyle = "#121212";
  ctx.fillRect(0, 0, 512, 1100);

  ctx.fillStyle = "#A0A0A0";
  ctx.font = "500 14px system-ui, sans-serif";
  ctx.fillText("21:14", 36, 42);
  ctx.fillText("5G  ●●●", 410, 42);

  ctx.fillStyle = "#D35427";
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.fillText("COME ON", 36, 86);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 34px system-ui, sans-serif";
  ctx.fillText("Casa Aurora", 36, 128);

  ctx.fillStyle = "#A0A0A0";
  ctx.font = "400 16px system-ui, sans-serif";
  ctx.fillText("Cozinha contemporânea · Mesa 12", 36, 154);

  roundRect(ctx, 36, 178, 440, 44, 10);
  ctx.fillStyle = "#1E1E1E";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.stroke();
  ctx.fillStyle = "#6b6b73";
  ctx.font = "400 15px system-ui, sans-serif";
  ctx.fillText("Buscar prato, bebida…", 56, 206);

  const chips = ["Entradas", "Pratos", "Vinhos"];
  chips.forEach((chip, i) => {
    const x = 36 + i * 118;
    roundRect(ctx, x, 242, 108, 34, 8);
    if (i === 1) {
      ctx.fillStyle = "#D35427";
      ctx.fill();
      ctx.fillStyle = "#ffffff";
    } else {
      ctx.fillStyle = "#1E1E1E";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
    }
    ctx.font = "600 13px system-ui, sans-serif";
    ctx.fillText(chip, x + 22, 264);
  });

  dish(
    ctx,
    300,
    "Ancho 300g",
    "Manteiga de ervas · batata uruguaia",
    "R$ 89",
    "#5c3a22",
    "PRATO DO DIA",
  );
  dish(
    ctx,
    450,
    "Risotto de funghi",
    "Porcini · parmesão 24 meses",
    "R$ 64",
    "#3d4a32",
  );
  dish(
    ctx,
    600,
    "Branzino na brasa",
    "Limão-siciliano · azeite da casa",
    "R$ 78",
    "#2c3d4a",
  );
  dish(
    ctx,
    750,
    "Tiramisu",
    "Café espresso · mascarpone",
    "R$ 32",
    "#4a322c",
  );

  roundRect(ctx, 36, 980, 440, 72, 16);
  ctx.fillStyle = "#1E1E1E";
  ctx.fill();
  ctx.strokeStyle = "rgba(211,84,39,0.35)";
  ctx.stroke();
  ctx.fillStyle = "#D35427";
  ctx.font = "700 16px system-ui, sans-serif";
  ctx.fillText("Enviar pedido no WhatsApp", 86, 1022);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}
