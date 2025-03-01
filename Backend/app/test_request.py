import requests

from opencage.geocoder import OpenCageGeocode

API_KEY = "2fb9ebbe9e88490cb39edf48d3016309"
geocoder = OpenCageGeocode(API_KEY)

address = "Paris, France"
results = geocoder.geocode(address)
print(results)
