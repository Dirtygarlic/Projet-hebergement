// Nouveau fichier : filters/globalFilters.js

export function getGlobalFiltersFromForm() {
    const dateRange = document.getElementById("date-range").value.trim().split(" au ");
    return {
        destination: document.getElementById("city").value.trim(),
        start_date: dateRange.length === 2 ? dateRange[0] : null,
        end_date: dateRange.length === 2 ? dateRange[1] : null,
        adults: parseInt(document.getElementById("adults").value, 10),
        children: parseInt(document.getElementById("children").value, 10),
        pets: document.getElementById("pets").checked ? 1 : 0
    };
}
