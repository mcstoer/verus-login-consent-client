/**
 * Function to parse navigation path string to array, where each
 * element is a member of the path originally separated by '/'
 * @param {String} path
 */
export const readNavigationPath = (path = null) => {
  return path ? path.split("/") : [];
};

/**
 * Returns the parent path of the navigationArray path
 * @param {String[]} navigationArray
 */
export const getPathParent = (navigationArray) => {
  return navigationArray.slice(0, -1).join('/');
};

/**
 * Checks if the current navigation is within a generic request detail flow.
 * This is determined by checking if a genericResponse exists in state.
 * @param {Object} state - The Redux state
 * @returns {boolean}
 */
export const isInDetailFlow = (state) => {
  return !!state.genericResponse && state.genericResponse.response !== null;
};

/**
 * Gets information about the current detail being processed.
 * @param {Object} state - The Redux state
 * @returns {Object|null} - { currentIndex, totalDetails, isLastDetail } or null
 */
export const getCurrentDetailInfo = (state) => {
  if (!isInDetailFlow(state)) {
    return null;
  }

  const currentIndex = state.genericResponse.currentDetailIndex || 0;
  const request = state.deeplink?.data;

  if (!request || !request.details) {
    return null;
  }

  const totalDetails = request.details.length;
  const isLastDetail = currentIndex === totalDetails - 1;

  return {
    currentIndex,
    totalDetails,
    isLastDetail
  };
};