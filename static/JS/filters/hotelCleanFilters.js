// Nouveau fichier : filters/filtersUtils.js

export function cleanFilters(filters) {
    Object.keys(filters).forEach(key => {
        if (
            filters[key] === null ||
            filters[key] === '' ||
            (Array.isArray(filters[key]) && filters[key].length === 0)
        ) {
            delete filters[key];
        }
    });
    return filters;
}
