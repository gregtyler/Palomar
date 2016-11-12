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

/**
 * Extract a range of models
 */
function rangeModels(models, limit, offset) {
  if (typeof offset !== 'number') offset = 0;
  if (typeof limit !== 'number') {
    return models.slice(offset);
  } else {
    return models.slice(offset, (offset + limit));
  }
}

module.exports = {
  sortModels,
  rangeModels
};
