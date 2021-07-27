/**
 * query.service.js
 * Structures the query request to ppo-data-service
 */
(function () {
    'use strict';

    angular.module('map.query')
        .factory('queryService', queryService);

    queryService.$inject = [ '$http', '$window', 'queryMap', 'queryResults', 'alerts', 'usSpinnerService', '$q'];
    //var REST_ROOT = "https://www.plantphenology.org/api/";
    //var REST_ROOT = "http://api.plantphenology.org/v1/query/"
    //var DOWNLOAD_REST_ROOT = "http://api.plantphenology.org/v1/download/"
    // temporarily using the old rest service which uses HTTPS and linked to same domain, this makes a difference
    var REST_ROOT = "https://www.plantphenology.org/api/v1/query/"
    var DOWNLOAD_REST_ROOT = "https://www.plantphenology.org/api/v2/download/"
   
    function queryService( $http, $window,  queryMap, queryResults, alerts, usSpinnerService, $q ) {

        var queryService = {
            queryJson: queryJson,
            downloadExcel: downloadExcel,
            downloadKml: downloadKml,
            downloadCsv: downloadCsv
        };

        return queryService;

	function queryLooper(query,from,size,source, dataSource) {
//alert(JSON.stringify(query))
		    // remove all alerts
	  	    var a = alerts.getAlerts();
                    for (var i = 0; i < a.length; i++) { alerts.remove(a[i]); }	

		    // query endpoint
                    var url = REST_ROOT + "_search?from=" + from + "&size=" + size + "&_source=" + encodeURIComponent(source); 
		    alerts.info("Loading results ...");
		    console.log(url+JSON.stringify(query))
            	    return $http({
                	method: 'GET',
                	url: url,
                	params: query,
                	keepJson: true
            	     }).then(queryJsonComplete);

 	           function queryJsonComplete(response) {
			// Removing the loading alert
                        var a = alerts.getAlerts();
         		for (var i = 0; i < a.length; i++) {
                       	     if (a[i].msg === 'Loading results ...') {
                                  alerts.remove(a[i]);
                             }
                        }
			// Initialize the results array
                	var results = {
                    		size: 0,
                    		totalElements: 0,
                    		data: [],
				source: ""
                	};

                	if (response.data) {
			    // Found elements is total possible results returned by ES
	             	    results.foundElements = response.data.hits.total;

			    // if the number of elements in result set is larger than the "size" then constrain variables 
	             	    results.source = dataSource
			    // accordingly.  Uses ES max record limit of 10,000
                            if (results.foundElements > size) {
                                alerts.info(results.foundElements +" total matches to query for " + dataSource +". Limiting to " + size + " records for this data source.")
                    	        results.size = size
	             	    	results.totalElements = size
                            } else {
                    	        results.size = results.foundElements;
	             	    	results.totalElements = results.foundElements;
                                //if (results.foundElements > 0) 
                               // 	alerts.info(results.foundElements + " results found for " + dataSource)
                                //else
                                 // 	alerts.info("No results found for " + dataSource)
			    }


			    // This is where the response data is copied over to the 
			    // results.data array
                            results.data = response.data.hits.hits;
                	}

                	return results;
            	}

	}

	    
	// Manage the query to provider
        function queryJson(query, page, source, dataSource) {
 	        var from = 0;
	        //var size = 2000;
	        var size = 10000;
	        //var maxRecords = 10000;
	        var maxRecords = 10000;
		
		// TODO: write an elasticsearch query client that can fetch more than 10,000 records using "scroll"
		// for now, am using the "queryLooper" function which was designed to loop through successive queries.
		// the "scroll" function, howerver, works differently
                return queryLooper(query, 0, maxRecords, source, dataSource);
	}

        function downloadExcel(query) {
            download("excel", query);
        }

        function downloadKml(query) {
            download("kml", query);
        }

        function downloadCsv(query) {
            download("csv", query);
        }


	function download (path, query) {
            usSpinnerService.spin('query-spinner');
    	    $http({
                method: 'GET',
		// The PPO download API is accessible by adding download to the api root
                url: DOWNLOAD_REST_ROOT + "?source=latitude,longitude,year,dayOfYear",
                params: query,
                keepJson: true,
        	responseType: 'arraybuffer'
    	    }).success(function (data, status, headers) {
            headers = headers();
 
	    // extract filename from content-disposition header (this SHOULD work, however, the
	    // content disposition header is not being captured by angular-js
      	    //var result = headers['Content-Disposition'].split(';')[1].trim().split('=')[1];
      	    //var filename =  result.replace(/"/g, '');

	    // here we know to expect a CSV/gzipped file so just name it here
	    var filename = "ppo_data.csv.gz"
            var contentType = headers['content-type'];
 
            var linkElement = document.createElement('a');
            try {
                var blob = new Blob([data], { type: contentType });
                var url = window.URL.createObjectURL(blob);
 
                linkElement.setAttribute('href', url);
                linkElement.setAttribute("download", filename);
 
                var clickEvent = new MouseEvent("click", {
                    "view": window,
                    "bubbles": true,
                    "cancelable": false
                });
                linkElement.dispatchEvent(clickEvent);
                usSpinnerService.stop('query-spinner');
            } catch (ex) {
                console.log(ex);
            }
            }).error(function (data) {
                alerts.info("Failed downloading file!");
                console.log(data);
            });
        }
    }
})();
