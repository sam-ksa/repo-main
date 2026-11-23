const { makePointsCommand } = require('./addpoint');

module.exports = makePointsCommand({
  name: 'removepoint', aliases: ['ازالة-نقاط'], sign: -1, title: 'إزالة نقاط', description: 'إزالة نقاط من قروب',
});
