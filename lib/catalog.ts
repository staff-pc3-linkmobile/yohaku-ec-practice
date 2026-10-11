export type Product = {
  id: string;
  name: string;
  english: string;
  category: string;
  price: number;
  initialStock: number;
  description: string;
  material: string;
  image: string;
  stock?: number;
};
export const catalog: Product[] = [
  {
    id: "mug",
    name: "丸いマグカップ",
    english: "EVERYDAY MUG / SAND",
    category: "暮らし",
    price: 1800,
    initialStock: 12,
    description:
      "手のひらにすっとなじむ、まるいかたち。朝のコーヒーにも、ひと息つくお茶にも。",
    material: "陶器 / 280ml",
    image: "/products/mug.svg",
  },
  {
    id: "notebook",
    name: "余白のノート",
    english: "PLAIN NOTEBOOK / OLIVE",
    category: "文具",
    price: 900,
    initialStock: 20,
    description:
      "考えごとを、自由に置いておける一冊。書く時間を少しだけ心地よく。",
    material: "紙 / A5・80ページ",
    image: "/products/notebook.svg",
  },
  {
    id: "tray",
    name: "木の小さなトレー",
    english: "WOODEN TRAY / NATURAL",
    category: "暮らし",
    price: 2400,
    initialStock: 8,
    description:
      "鍵やアクセサリーに、小さな居場所を。木の表情を楽しむ道具です。",
    material: "天然木 / 18 × 12cm",
    image: "/products/tray.svg",
  },
  {
    id: "bag",
    name: "リネンのトート",
    english: "LINEN TOTE / ECRU",
    category: "暮らし",
    price: 3200,
    initialStock: 10,
    description: "軽やかに出かける日の相棒。使うほどに、やわらかくなじみます。",
    material: "リネン / 32 × 36cm",
    image: "/products/bag.svg",
  },
  {
    id: "pen",
    name: "木軸のボールペン",
    english: "WOODEN PEN / WALNUT",
    category: "文具",
    price: 1200,
    initialStock: 15,
    description: "ひとことのメモも、少し丁寧に。あたたかな木の手ざわりを。",
    material: "木・金属 / 黒インク",
    image: "/products/pen.svg",
  },
  {
    id: "towel",
    name: "やわらかいハンドタオル",
    english: "COTTON TOWEL / SAGE",
    category: "暮らし",
    price: 800,
    initialStock: 18,
    description: "毎日持ち歩きたくなる、やさしい肌ざわり。落ち着いたセージ色。",
    material: "綿100% / 25 × 25cm",
    image: "/products/towel.svg",
  },
];
