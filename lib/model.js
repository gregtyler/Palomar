/**
 * Sort some models by the specified parameters
 */
function sortModels(models, order) {
  const orderRev = order.substr(-1) === '^' ? true : false;
  const orderParam = order.replace(/\^+$/, '');
  models.sort(function(a, b) {
    return (orderRev ? -1 : 1) * (a[orderParam] > b[orderParam] ? 1 : -1);
  });
}

module.exports = {
  sortModels
};
