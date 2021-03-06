(function () {
    'use strict';

    angular.module('map.query')
        .factory('queryParams', queryParams);

    queryParams.$inject = ['QueryBuilder'];

    function queryParams(QueryBuilder) {
        var defaultParams = {
            traits: null,
            fromYear: null,
            toYear: null,
            fromDay: null,
            toDay: null,
            genus: null,
            specificEpithet: null,
            source: null
        };

        var params = {
            //traits: [],
            build: buildQuery,
            clear: clear
        };

        activate();
        return params;

        function activate() {
            clear();
        }


       function buildQuery(source) {
           var builder = new QueryBuilder();

           //angular.forEach(params.traits, function (t) {
            //  builder.add("+plantStructurePresenceTypes:\"" + t + "\"");
           //});
           if (params.traits) {
               builder.add("+plantStructurePresenceTypes:\"" + params.traits+"\"");
           }
           if (params.fromYear) {
               builder.add("+year:>=" + params.fromYear);
           }
           if (params.toYear) {
               builder.add("+year:<=" + params.toYear);
           }
           if (params.fromDay) {
               builder.add("+dayOfYear:>=" + params.fromDay);
	   }
	   if (params.toDay) {
	       builder.add("+dayOfYear:<=" + params.toDay);
	   }
           if (params.genus) {
             builder.add("+genus:" + params.genus);
           }
           if (params.specificEpithet) {
             builder.add("+specificEpithet:" + params.specificEpithet);
           }
//           if (params.source) {
 //            builder.add("+source:" + params.source);
  //         }
	   builder.add("+source:" + source)
           //builder.setSource(source);
           return builder.build();
       }

       function clear() {
           angular.extend(params, defaultParams);
       }
    }
})();
