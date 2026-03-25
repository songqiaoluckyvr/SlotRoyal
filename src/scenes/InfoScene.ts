import Phaser from 'phaser';
import { SYMBOLS } from '../core/SymbolTable';
import { generatePaylines } from '../core/PaylineEvaluator';

interface InfoSceneData {
  onClose: () => void;
  gridRows: number;
  gridCols: number;
}

type Tab = 'payouts' | 'paylines' | 'powerups';

export class InfoScene extends Phaser.Scene {
  private sceneData!: InfoSceneData;
  private tabContainer!: Phaser.GameObjects.Container;
  private contentContainer!: Phaser.GameObjects.Container;
  private tabBtns: { btn: Phaser.GameObjects.Text; tab: Tab }[] = [];

  constructor() {
    super('Info');
  }

  create(data: InfoSceneData): void {
    this.sceneData = data;
    this.tabBtns = [];
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Dim overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88);

    // Title
    this.add.text(W / 2, 14, 'GAME INFO', {
      fontSize: '24px', color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Close button
    const closeBtn = this.add.text(W - 16, 10, 'X', {
      fontSize: '24px', color: '#ff4444', fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#1a1a2e', padding: { x: 8, y: 2 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#ff8888'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ff4444'));
    closeBtn.on('pointerdown', () => this.closeScene());

    // Tabs
    this.tabContainer = this.add.container(0, 44);
    const tabs: { label: string; tab: Tab }[] = [
      { label: 'Payouts', tab: 'payouts' },
      { label: 'Paylines', tab: 'paylines' },
      { label: 'Powerups', tab: 'powerups' },
    ];
    const tabWidth = 160;
    const tabStartX = W / 2 - ((tabs.length - 1) * tabWidth) / 2;

    for (let i = 0; i < tabs.length; i++) {
      const t = tabs[i];
      const btn = this.add.text(tabStartX + i * tabWidth, 0, t.label, {
        fontSize: '16px', color: '#bbbbbb', fontFamily: 'monospace',
        backgroundColor: '#222244', padding: { x: 16, y: 6 },
      }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => this.switchTab(t.tab));
      this.tabContainer.add(btn);
      this.tabBtns.push({ btn, tab: t.tab });
    }

    // Content area
    this.contentContainer = this.add.container(0, 80);

    this.switchTab('payouts');
  }

  private switchTab(tab: Tab): void {
    // tab tracked for styling
    this.contentContainer.removeAll(true);

    // Update tab styles
    for (const t of this.tabBtns) {
      if (t.tab === tab) {
        t.btn.setColor('#ffffff');
        t.btn.setBackgroundColor('#444488');
      } else {
        t.btn.setColor('#888888');
        t.btn.setBackgroundColor('#222244');
      }
    }

    const W = this.cameras.main.width;
    switch (tab) {
      case 'payouts': this.buildPayoutTab(W); break;
      case 'paylines': this.buildPaylineTab(W); break;
      case 'powerups': this.buildPowerupTab(W); break;
    }
  }

  /* ─── PAYOUTS TAB ─── */
  private buildPayoutTab(W: number): void {
    let y = 0;

    // Column headers
    const colX = { icon: 50, name: 100, m3: 360, m4: 460, m5: 560, m6: 660 };
    const hdr = (text: string, x: number) => {
      const t = this.add.text(x, y, text, {
        fontSize: '13px', color: '#aaaaaa', fontFamily: 'monospace',
      });
      this.contentContainer.add(t);
    };
    hdr('Symbol', colX.name);
    hdr('x3', colX.m3);
    hdr('x4', colX.m4);
    hdr('x5', colX.m5);
    hdr('x6', colX.m6);
    y += 20;

    const sep = this.add.rectangle(W / 2, y, W - 60, 1, 0x333344).setOrigin(0.5, 0);
    this.contentContainer.add(sep);
    y += 6;

    const rowH = 56;
    for (const sym of SYMBOLS) {
      // Icon
      const icon = this.add.image(colX.icon, y + rowH / 2, sym.id).setOrigin(0.5);
      const iconScale = 40 / Math.max(icon.width, icon.height);
      icon.setScale(iconScale);
      this.contentContainer.add(icon);

      // Border
      const border = this.add.rectangle(colX.icon, y + rowH / 2, 44, 44)
        .setStrokeStyle(2, sym.color).setFillStyle(0x000000, 0);
      this.contentContainer.add(border);

      // Name
      const nameColor = sym.isWild ? '#ffffff' : `#${sym.color.toString(16).padStart(6, '0')}`;
      this.contentContainer.add(this.add.text(colX.name, y + 8, sym.name, {
        fontSize: '14px', color: nameColor, fontFamily: 'monospace',
        fontStyle: sym.isWild ? 'bold' : '',
      }));

      // Rarity
      const rarity = sym.isWild ? 'WILD' : sym.weight >= 22 ? 'Common' : sym.weight >= 10 ? 'Uncommon' : 'Rare';
      const rarityColor = sym.isWild ? '#ff4444' : sym.weight >= 22 ? '#888888' : sym.weight >= 10 ? '#44aaff' : '#ff8844';
      this.contentContainer.add(this.add.text(colX.name, y + 26, rarity, {
        fontSize: '10px', color: rarityColor, fontFamily: 'monospace',
      }));

      // Payouts
      const addPay = (x: number, count: number) => {
        const val = sym.payouts[count] ?? '-';
        this.contentContainer.add(this.add.text(x, y + 16, `${val}`, {
          fontSize: '16px', color: '#cccccc', fontFamily: 'monospace',
        }));
      };
      addPay(colX.m3, 3);
      addPay(colX.m4, 4);
      addPay(colX.m5, 5);
      addPay(colX.m6, 6);

      y += rowH;
    }

    // Note
    this.contentContainer.add(this.add.text(W / 2, y + 8, 'Payouts are multiplied by bet amount · Wild substitutes for any symbol', {
      fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5, 0));
  }

  /* ─── PAYLINES TAB ─── */
  private buildPaylineTab(W: number): void {
    const rows = this.sceneData.gridRows;
    const cols = this.sceneData.gridCols;
    const paylines = generatePaylines(rows, cols);

    let y = 0;
    this.contentContainer.add(this.add.text(W / 2, y, `Current grid: ${rows}×${cols}  ·  ${paylines.length} paylines`, {
      fontSize: '14px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5, 0));
    y += 28;

    // Size mini grids to fit in available space (750 - 80 top - 28 header = ~640 available height)
    const availH = 620;
    const availW = W - 40;

    // Calculate grid layout
    const gridsPerRow = Math.min(7, Math.max(4, Math.ceil(Math.sqrt(paylines.length * 1.5))));
    const totalGridRows = Math.ceil(paylines.length / gridsPerRow);

    // Size cells to fit
    const maxMiniW = (availW / gridsPerRow) - 20;
    const maxMiniH = (availH / totalGridRows) - 22;
    const cellSize = Math.min(
      Math.floor(maxMiniW / cols),
      Math.floor(maxMiniH / rows),
      14
    );
    const cellGap = 1;
    const miniW = cols * (cellSize + cellGap) - cellGap;
    const miniH = rows * (cellSize + cellGap) - cellGap;
    const spacingX = availW / gridsPerRow;
    const spacingY = miniH + 24;

    const colors = [
      0x44ff44, 0x44aaff, 0xff8844, 0xffcc00, 0xcc44ff,
      0xff4444, 0x44ffcc, 0xff66aa, 0xaaaaff, 0xffaa44,
      0x88ff88, 0x8888ff, 0xff8888, 0xcccc44, 0xff44cc,
      0x44ccff, 0xaaff44, 0xff6644, 0x44ffaa, 0xccaaff,
    ];

    for (let i = 0; i < paylines.length; i++) {
      const gc = i % gridsPerRow;
      const gr = Math.floor(i / gridsPerRow);
      const baseX = 20 + gc * spacingX + (spacingX - miniW) / 2;
      const baseY = y + gr * spacingY;
      const color = colors[i % colors.length];
      const colorStr = `#${color.toString(16).padStart(6, '0')}`;

      // Label
      this.contentContainer.add(this.add.text(
        baseX + miniW / 2, baseY - 2, `#${i + 1}`,
        { fontSize: '10px', color: colorStr, fontFamily: 'monospace' }
      ).setOrigin(0.5, 1));

      // Mini grid cells
      const pl = paylines[i];
      const activeSet = new Set(pl.positions.map(([r, c]) => `${r},${c}`));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = baseX + c * (cellSize + cellGap) + cellSize / 2;
          const cy = baseY + r * (cellSize + cellGap) + cellSize / 2;
          const active = activeSet.has(`${r},${c}`);

          this.contentContainer.add(this.add.rectangle(
            cx, cy, cellSize, cellSize,
            active ? color : 0x191928,
            active ? 0.9 : 0.5
          ).setStrokeStyle(1, active ? color : 0x2a2a3a));
        }
      }
    }

    const totalH = totalGridRows * spacingY;
    this.contentContainer.add(this.add.text(W / 2, y + totalH + 4, 'Min 3 consecutive matches from left to win', {
      fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5, 0));
  }

  /* ─── POWERUPS TAB ─── */
  private buildPowerupTab(W: number): void {
    let y = 0;

    const powerups = [
      { name: 'Free Spins', desc: 'Grants extra spins at no cost. Applied instantly, no slot needed.', color: 0x44ff44, type: 'Instant' },
      { name: 'Extra Row', desc: 'Adds a row to the grid, unlocking more paylines.', color: 0xff8844, type: 'Persistent' },
      { name: 'Extra Column', desc: 'Adds a column, enabling longer symbol matches.', color: 0x44aaff, type: 'Persistent' },
      { name: 'Rarity Value Up', desc: 'Boosts payout multiplier for an entire rarity tier (Common/Uncommon/Rare).', color: 0xffcc00, type: 'Persistent' },
      { name: 'Rarity Chance Up', desc: 'Increases appearance rate for an entire rarity tier.', color: 0xcc44ff, type: 'Persistent' },
      { name: 'Red Pocket', desc: 'Instant random cash reward scaled by level. No slot needed.', color: 0xff2222, type: 'Instant' },
    ];

    for (const pu of powerups) {
      const colorStr = `#${pu.color.toString(16).padStart(6, '0')}`;

      // Accent bar
      this.contentContainer.add(this.add.rectangle(44, y + 20, 4, 40, pu.color));

      // Name
      const nameText = this.add.text(58, y + 4, pu.name, {
        fontSize: '16px', color: colorStr, fontFamily: 'monospace', fontStyle: 'bold',
      });
      this.contentContainer.add(nameText);

      // Type badge
      const typeColor = pu.type === 'Instant' ? '#ff8844' : '#44aaff';
      this.contentContainer.add(this.add.text(58 + nameText.width + 10, y + 6, `[${pu.type}]`, {
        fontSize: '11px', color: typeColor, fontFamily: 'monospace',
      }));

      // Description
      this.contentContainer.add(this.add.text(58, y + 26, pu.desc, {
        fontSize: '13px', color: '#aaaaaa', fontFamily: 'monospace',
        wordWrap: { width: W - 120 },
      }));

      y += 58;
    }

    // Notes section
    y += 10;
    const sep = this.add.rectangle(W / 2, y, W - 80, 1, 0x333344).setOrigin(0.5, 0);
    this.contentContainer.add(sep);
    y += 14;

    const notes = [
      'Powerups are offered at 25%, 50%, 75%, and 100% of the earnings target.',
      'Max 3 active slots. Same-type powerups merge to increase level.',
      'Passive powerups carry over between levels and occupy a slot.',
      'Instant powerups apply immediately and don\'t take a slot.',
    ];

    for (const note of notes) {
      this.contentContainer.add(this.add.text(58, y, '· ' + note, {
        fontSize: '12px', color: '#bbbbbb', fontFamily: 'monospace',
        wordWrap: { width: W - 120 },
      }));
      y += 22;
    }
  }

  private closeScene(): void {
    this.sceneData.onClose();
    this.scene.stop();
  }
}
