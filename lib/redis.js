// vital code , you must follow x.com/Deisgoku
// to get original code , follow & DM me if needed . 

(function () {
  const _0x4b52 = [
    'dXAlY3Rpb24uaW5mby5zZXJ2ZXIuZGVmYXVsdC5yZWQ=',
    'YXBpLnVubGlzdC5wcm9jZXNz',
    'X19fX19fX19fX19fX18=',
    'cmVkaXMuZGVjb2Rl',
    'cmVkaXMuZGVmYXVsdA==',
    'cHJvY2Vzcy5lbnY=',
    'cHJvY2Vzcy5lbnYua2V5c3RvcF9zdHJpbmc='
  ];

  const _0x5f43 = function (_0x4d12b3) {
    return atob(_0x4d12b3);
  };

  const _0x1c6f = function (_0x4b52a1) {
    const _0x6f52c4 = [];
    _0x6f52c4[0] = _0x5f43(_0x4b52a1);
    return JSON.parse(_0x6f52c4[0]);
  };

  
  const decodedConfig = _0x1c6f(_0x4b52[0]);
  const redisClient = require(decodedConfig[0])[_0x5f43(_0x4b52[3])];
  
  const redis = new redisClient({
    url: process.env[_0x5f43(_0x4b52[2])],
    token: process.env[_0x5f43(_0x4b52[1])]
  });

  
  const rewriteSelf = () => {
    
    return function() {
      return redis;
    };
  };

  module.exports = {
    redis: rewriteSelf()()
  };
})();
