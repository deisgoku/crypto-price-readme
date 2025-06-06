// lib/settings/theme.js
// author : DeisGoku


const fontStyles = {
    fontTitle: "font-family: Verdana; font-size: 14px; font-weight: bold;",
    fontSubTitle: "font-family: Verdana; font-size: 13px; font-weight: bold;",
    fontHeader: "font-family: Arial; font-size: 13px; font-weight: bold;",
    fontRow: "font-family: monospace; font-size: 13px;",
    fontFooter1: "font-family: Verdana; font-size: 12px; font-weight: bold;",
    fontFooter2: "font-family: sans-serif; font-size: 12px;",
};




const trendUpGradient = (id = "trendUpGradient") => `
  <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#00c46a" stop-opacity="0.2" />
    <stop offset="100%" stop-color="#00c46a" stop-opacity="0.02" />
  </linearGradient>
`;

const trendDownGradient = (id = "trendDownGradient") => `
  <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ff595e" stop-opacity="0.2" />
    <stop offset="100%" stop-color="#ff595e" stop-opacity="0.02" />
  </linearGradient>
`;




const themes = {
  dark: {
    bgColor: '#0d0d0d',
    textColor: '#ffffff',
    borderColor: '#ffffff33',
    rowBorder: '#ffffff55',
    trendUp: '#00c46a',
    trendDown: '#ff595e',
    trendUpBg: '#00c46a20',
    trendDownBg: '#ff595e20',
    headBg: '#ffffff10',
    headText: '#ffffff',
    shadowColor: '#ffffff20',
  },
  light: {
    bgColor: '#ffffff',
    textColor: '#111111',
    borderColor: '#11111133',
    rowBorder: '#11111166',
    trendUp: '#00c46a',
    trendDown: '#ff595e',
    trendUpBg: '#00c46a20',
    trendDownBg: '#ff595e20',
    headBg: '#f1f1f1',
    headText: '#111111',
    shadowColor: '#00000020',
  },
  dracula: {
    bgColor: '#282a36',
    textColor: '#f8f8f2',
    borderColor: '#f8f8f255',
    rowBorder: '#f8f8f288',
    trendUp: '#50fa7b',
    trendDown: '#ff5555',
    trendUpBg: '#50fa7b20',
    trendDownBg: '#ff555520',
    headBg: '#44475a',
    headText: '#ff79c6',
    shadowColor: '#ffffff20',
  },
  solarized: {
    bgColor: '#002b36',
    textColor: '#839496',
    borderColor: '#586e75',
    rowBorder: '#93a1a1',
    trendUp: '#859900',
    trendDown: '#dc322f',
    trendUpBg: '#85990020',
    trendDownBg: '#dc322f20',
    headBg: '#073642',
    headText: '#839496',
    shadowColor: '#00000020',
  },
  nord: {
    bgColor: '#2e3440',
    textColor: '#d8dee9',
    borderColor: '#4c566a',
    rowBorder: '#3b4252',
    trendUp: '#a3be8c',
    trendDown: '#bf616a',
    trendUpBg: '#a3be8c20',
    trendDownBg: '#bf616a20',
    headBg: '#3b4252',
    headText: '#d8dee9',
    shadowColor: '#00000020',
  },
  material: {
    bgColor: '#263238',
    textColor: '#eceff1',
    borderColor: '#37474f',
    rowBorder: '#455a64',
    trendUp: '#80cbc4',
    trendDown: '#ff8a80',
    trendUpBg: '#80cbc420',
    trendDownBg: '#ff8a8020',
    headBg: '#37474f',
    headText: '#cfd8dc',
    shadowColor: '#00000030',
  },
  monokai: {
    bgColor: '#272822',
    textColor: '#f8f8f2',
    borderColor: '#75715e',
    rowBorder: '#49483e',
    trendUp: '#a6e22e',
    trendDown: '#f92672',
    trendUpBg: '#a6e22e20',
    trendDownBg: '#f9267220',
    headBg: '#3e3d32',
    headText: '#fd971f',
    shadowColor: '#00000020',
  },
  nightowl: {
    bgColor: '#011627',
    textColor: '#d6deeb',
    borderColor: '#1d3b53',
    rowBorder: '#1e2d3d',
    trendUp: '#82aaff',
    trendDown: '#ef5350',
    trendUpBg: '#82aaff20',
    trendDownBg: '#ef535020',
    headBg: '#1d3b53',
    headText: '#d6deeb',
    shadowColor: '#00000030',
  },
  palenight: {
    bgColor: '#292d3e',
    textColor: '#a6accd',
    borderColor: '#676e95',
    rowBorder: '#3c435e',
    trendUp: '#c3e88d',
    trendDown: '#f07178',
    trendUpBg: '#c3e88d20',
    trendDownBg: '#f0717820',
    headBg: '#444267',
    headText: '#82aaff',
    shadowColor: '#00000025',
  },
  codedark: {
    bgColor: '#1e1e1e',
    textColor: '#d4d4d4',
    borderColor: '#333333',
    rowBorder: '#3c3c3c',
    trendUp: '#b5cea8',
    trendDown: '#f48771',
    trendUpBg: '#b5cea820',
    trendDownBg: '#f4877120',
    headBg: '#252526',
    headText: '#9cdcfe',
    shadowColor: '#00000025',
  },
  gruvbok: {
    bgColor: '#282828',
    textColor: '#ebdbb2',
    borderColor: '#3c3836',
    rowBorder: '#504945',
    trendUp: '#b8bb26',
    trendDown: '#fb4934',
    trendUpBg: '#b8bb2620',
    trendDownBg: '#fb493420',
    headBg: '#3c3836',
    headText: '#fabd2f',
    shadowColor: '#00000025',
  },
  tokyonight: {
    bgColor: '#1a1b26',
    textColor: '#c0caf5',
    borderColor: '#3b4261',
    rowBorder: '#414868',
    trendUp: '#9ece6a',
    trendDown: '#f7768e',
    trendUpBg: '#9ece6a20',
    trendDownBg: '#f7768e20',
    headBg: '#24283b',
    headText: '#7aa2f7',
    shadowColor: '#00000030',
  },
  ayu: {
    bgColor: '#0f1419',
    textColor: '#b3b1ad',
    borderColor: '#1f242a',
    rowBorder: '#2c313a',
    trendUp: '#aad94c',
    trendDown: '#ff7733',
    trendUpBg: '#aad94c20',
    trendDownBg: '#ff773320',
    headBg: '#1f242a',
    headText: '#ffd580',
    shadowColor: '#00000025',
  },
  onedark: {
    bgColor: '#282c34',
    textColor: '#abb2bf',
    borderColor: '#3e4451',
    rowBorder: '#4b5263',
    trendUp: '#98c379',
    trendDown: '#e06c75',
    trendUpBg: '#98c37920',
    trendDownBg: '#e06c7520',
    headBg: '#3e4451',
    headText: '#61afef',
    shadowColor: '#00000020',
  },
  flux: {
    bgColor: '#111111',
    textColor: '#ffffff',
    borderColor: '#444444',
    rowBorder: '#666666',
    trendUp: '#00ff99',
    trendDown: '#ff0066',
    trendUpBg: '#00ff9920',
    trendDownBg: '#ff006620',
    headBg: '#222222',
    headText: '#ffaa00',
    shadowColor: '#00000025',
  },
  aurora: {
    bgColor: '#1a1b26',
    textColor: '#c0caf5',
    borderColor: '#ccccccc',
    rowBorder: '#414868',
    trendUp: '#9ece6a',
    trendDown: '#f7768e',
    trendUpBg: '#9ece6a20',
    trendDownBg: '#f7768e20',
    headBg: '#24283b',
    headText: '#ffffff',
    shadowColor: '#00000030',
  },
};


const themeNames = Object.keys(themes); 

module.exports = {
  themes,
  themeNames,
  fontStyles,
  trendUpGradient,
  trendDownGradient,
};
