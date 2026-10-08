# Bancada em SVG/DOM, não em engine de jogo

Apesar da proposta "tipo jogo", a Bancada é renderizada em SVG/DOM com React (drag-and-drop via dnd-kit, animações via Framer Motion) em vez de canvas/WebGL (Phaser/Pixi). Assim, busca, Bandeja e Bancada ficam num único modelo de UI, o arraste funciona com teclado, toque e leitores de tela, e as Peças usam ilustrações SVG genéricas por Categoria. Abrimos mão de física e efeitos visuais mais ricos.
