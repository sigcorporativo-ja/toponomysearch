import Toponomysearch from 'facade/toponomysearch';

const map = M.map({
  container: 'mapjs',
});

const mp = new Toponomysearch();

map.addPlugin(mp);
