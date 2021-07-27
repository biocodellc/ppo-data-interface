(function (angular) {
    'use strict';
    var app = angular.module('map.query');
    app.controller('QueryFormController', QueryFormController);
    app.$inject = [  '$http', '$scope', 'ui-bootstrap', 'queryParams', 'queryService', 'queryMap', 'queryResults', 'usSpinnerService', 'alerts', '$sce'];
    function QueryFormController($http, $scope, queryParams, queryService, queryMap, queryResults, usSpinnerService, alerts, $sce) {
 
     	// toggle download modal dialog
        $scope.downloadModalShown = false;
        $scope.toggleDownloadModal = function() { 
	    // Before showing the download modal, decide if we should show
	    // the verification text or not, PEP725 data cannot be downloaded now
	   if ($scope.hasPEP725Data) {
	       $scope.verificationStep = true
	       $scope.downloadButtonShown = false
	   } else {
	       $scope.verificationStep = false
	       $scope.downloadButtonShown = true
 	   }
            $scope.downloadModalShown = !$scope.downloadModalShown; 
        };

        $scope.hasPEP725Data = false;

        // toggle modal dialog
        $scope.modalShown = false;
        $scope.toggleModal = function(modalType) { 
	    $scope.modalType = modalType
	    if (modalType == "Traits") {
		$scope.modalText= $sce.trustAsHtml(
            	"The traits listed here are derived from the Plant Phenology Ontology (PPO). Included here are all present and absent trait values including " +
	    	"parents which encompass child traits.  For example, a query for 'fruits present', will return instances of 'ripening fruits present', "+
	        "'unripe fruits present', and 'ripe fruits present' from the PPO. Currently, this interface enables searching on one trait at time. " + 
	    	"For more information on the PPO, visit the <a href='https://github.com/PlantPhenoOntology/ppo' target='_blank'>PPO Website</a>." +
	    	"<p></p>For USA-NPN and NEON data, all present traits were inferred by looking at positive count or percentages included with the source "+
		"data.  For zero count or percentage data, the traits were inferred as absent.  To determine how mappings were assigned for each data " +
		"source, visit the <a href='https://github.com/biocodellc/ppo-data-pipeline/blob/master/projects/pep725/phenophase_descriptions.csv' target='_blank'>PEP725</a>, <a href='https://github.com/biocodellc/ppo-data-pipeline/blob/master/projects/npn/phenophase_descriptions.csv' target='_blank'>USA-NPN</a>, or <a href='https://github.com/biocodellc/ppo-data-pipeline/blob/master/projects/neon/phenophase_descriptions.csv' target='_blank'>NEON</a> mapping tables at the <a href='https://github.com/biocodellc/ppo-data-pipeline' target='_blank'>ppo-data-pipeline</a> site.");
	    } else if (modalType == "Genus") {
            	$scope.modalText = $sce.trustAsHtml("Queries on genus are required in order to help constrain the number of records returned on queries and improve the performance of the interface itself.  Also, we encourage genus level queries over genus + species queries since genus is typically a better metric for comparing phenological patterns across continents, which is the primary purpose of this interface.");
	    } else if (modalType == "Species") {
            	$scope.modalText = $sce.trustAsHtml("After specifying a genus name you may also clarify with a species name.  For example, to query on <i>Oenothera biennis</i> select Oenothera from the genus drop-down list and enter 'biennis' in the species text box.")
	    } else if (modalType == "Source") {
            	$scope.modalText = $sce.trustAsHtml("You may select one or more datasources from the list provided. Use the option key (Mac) or control key (Windows) to make your selections. Currently, the PEP725 data cannot be downloaded from this interface.  If you select NEON and/or USA-NPN, or your results do not contain any PEP725 data, then you may freely download data. ");
	    } else if (modalType == "Year") {
            	$scope.modalText = $sce.trustAsHtml("USA-NPN and NEON data, which constitutes all of the North American data in this portal, appear only after the year 2009, with the exception of the genus <i>Syringa</i> (Lilac).  USA-NPN Lilac data begins in 1956.  PEP725 data constitutes all of our European data, and begins in 1868.");
	    } else if (modalType == "Day of Year") {
            	$scope.modalText = $sce.trustAsHtml("Constrain by the Day of Year a particular observation was made.  For instance, to view all traits appearing before day 100, slide the upper level slider from 365 down to 100, while leaving the lower end of the slider tool at 1.");
	    }

	    $scope.modalShown = !$scope.modalShown; 
	};

        var vm = this;
        var _currentLayer = undefined;

        var SOURCE = ["latitude", "longitude", "startDayOfYear", "year", "dayOfYear", "genus", "specificEpithet", "source", "eventId", "subSource"];

        var vm = this;

        //Handle Download Dialog Events
	// If PEP725 is a datasource, must enter a code to continue,
	// otherwise can show download button
        $scope.downloadButtonShown = false;
        $scope.verify= function () {
            if (queryParams.verifyDownload == "ppo2017") {
                    $scope.downloadButtonShown = true;
            }
        }

	queryParams.fromYear= 1868;
	queryParams.toYear= 2019;
	vm.year = {
	    options: {
                floor: queryParams.fromYear,
                ceil: queryParams.toYear,
		step: 1,
		// note this is never called
		onEnd: function() {$scope.queryForm.$setPristine(false)}
	    }
	};
	queryParams.fromDay= 1; 
	queryParams.toDay= 365;
	$scope.day = {
	    options: {
                floor: 1,
                ceil: 365,
		step: 1, 
		// note this is never called
		onEnd: function() {$scope.queryForm.$setPristine(false)}
	    }
	};

	//Get trait data to populate dropdown
	var fetchTraits = $http({
		method: 'GET',
		url: 'https://www.plantphenology.org/api/v2/ppo/all_short'
	 }).then(
	 	function successCallback(response) {
			var dataObj = response.data
			vm.traits = dataObj
		}, 
		function errorCallback(response) {
			console.log('error fetching traits from ppo data service');
			vm.traits = {}
		}
	);

	// Dataserouces we are included
 	vm.dataSources = {
          'USA-NPN':'USA National Phenology Network',
          'PEP725':'Pan European Phenology Database',
          'NEON':'National Ecological Observatory Network'
	  //'HERBARIUM':'Herbarium Data Sources',
	  //'IMAGE_SCORING':'Image Scoring Records from iNaturalist'
        };	

	// Pre-select all dataSources for the source multiple drop-down box
	var selectedSources = []
	for (var key in vm.dataSources) 
		selectedSources.push(key);
	queryParams.source = selectedSources;

          //'Regional North American Herbaria Network':'ASU'

	// An abbreviated list of genus names (selectec by genera with > 3,000 observations amongst data sources
	vm.genus = [ 
'Abies', 'Acacia', 'Acer', 'Achillea', 'Achlys', 'Actaea', 'Actinidia', 'Adenostoma', 'Aesculus', 'Agave', 'Ageratina', 'Alliaria', 'Allium', 'Alnus', 'Alopecurus', 'Ambrosia', 'Amelanchier', 'Amorpha', 'Anacardium', 'Andromeda', 'Andropogon', 'Anemone', 'Apocynum', 'Aquilegia', 'Aralia', 'Arbutus', 'Arctostaphylos', 'Arisaema', 'Aristida', 'Arnica', 'Aronia', 'Artemisia', 'Aruncus', 'Asarum', 'Asclepias', 'Asimina', 'Asparagus', 'Atriplex', 'Atropa', 'Avena', 'Avicennia', 'Baccharis', 'Baileya', 'Balsamorhiza', 'Baptisia', 'Barbarea', 'Berberis', 'Beta', 'Betula', 'Bouteloua', 'Brassica', 'Bromus', 'Bursera', 'Calamagrostis', 'Callicarpa', 'Calluna', 'Caltha', 'Calylophus', 'Calystegia', 'Camassia', 'Camissoniopsis', 'Campanula', 'Campsis', 'Cardamine', 'Carex', 'Carnegiea', 'Carpinus', 'Carya', 'Castanea', 'Castilleja', 'Catalpa', 'Caulophyllum', 'Ceanothus', 'Celtis', 'Centaurea', 'Cephalanthus', 'Ceratocephala', 'Cercis', 'Cercocarpus', 'Chamaecyparis', 'Chamaedaphne', 'Chamerion', 'Cheirodendron', 'Chilopsis', 'Chimaphila', 'Cirsium', 'Cistus', 'Citrus', 'Cladrastis', 'Claytonia', 'Clematis', 'Clintonia', 'Coccoloba', 'Colchicum', 'Coleogyne', 'Conocarpus', 'Convallaria', 'Coptis', 'Coreopsis', 'Cornus', 'Corylus', 'Crataegus', 'Crinum', 'Crocus', 'Cuscuta', 'Cyclamen', 'Cydonia', 'Cynodon', 'Cypripedium', 'Cytisus', 'Dactylis', 'Dalea', 'Dasiphora', 'Dasylirion', 'Datura', 'Daucus', 'Delphinium', 'Deschampsia', 'Desmodium', 'Diapensia', 'Dicentra', 'Dichanthium', 'Dichelostemma', 'Diospyros', 'Diplacus', 'Dittrichia', 'Dodecatheon', 'Dodonaea', 'Dryas', 'Echinacea', 'Echinocereus', 'Eichhornia', 'Elaeagnus', 'Empetrum', 'Encelia', 'Enemion', 'Ephedra', 'Epigaea', 'Epilobium', 'Epipactis', 'Ericameria', 'Erigeron', 'Eriogonum', 'Eriophorum', 'Eriophyllum', 'Erodium', 'Erythronium', 'Eschscholzia', 'Escobaria', 'Euonymus', 'Euphorbia', 'Eurybia', 'Euthamia', 'Eutrochium', 'Fagus', 'Ferocactus', 'Festuca', 'Ficus', 'Flourensia', 'Foeniculum', 'Forestiera', 'Forsythia', 'Fouquieria', 'Fragaria', 'Frangula', 'Fraxinus', 'Fritillaria', 'Gaillardia', 'Galanthus', 'Gardenia', 'Garrya', 'Gaultheria', 'Gaylussacia', 'Gelsemium', 'Gentiana', 'Gentianopsis', 'Geranium', 'Geum', 'Ginkgo', 'Gleditsia', 'Glycine', 'Goodyera', 'Gossypium', 'Guaiacum', 'Guazuma', 'Gutierrezia', 'Gymnanthes', 'Halesia', 'Hamamelis', 'Handroanthus', 'Hedera', 'Hedysarum', 'Helianthus', 'Helleborus', 'Hemerocallis', 'Heracleum', 'Hesperostipa', 'Hesperoyucca', 'Heteromeles', 'Hieracium', 'Hilaria', 'Holodiscus', 'Hordeum', 'Hydrophyllum', 'Hymenocallis', 'Ilex', 'Impatiens', 'Ipomopsis', 'Iris', 'Jacaranda', 'Juglans', 'Juniperus', 'Kalmia', 'Kosteletzkya', 'Krascheninnikovia', 'Laguncularia', 'Larix', 'Larrea', 'Lathyrus', 'Laurus', 'Ledum', 'Leucaena', 'Leucanthemum', 'Leucojum', 'Leucophyllum', 'Lewisia', 'Leymus', 'Liatris', 'Licania', 'Ligustrum', 'Lilium', 'Limonium', 'Lindera', 'Linnaea', 'Linum', 'Liquidambar', 'Liriodendron', 'Lobelia', 'Lonicera', 'Lupinus', 'Lycium', 'Lysichiton', 'Lythrum', 'Magnolia', 'Mahonia', 'Maianthemum', 'Malacothrix', 'Malosma', 'Malus', 'Medeola', 'Medicago', 'Melilotus', 'Mertensia', 'Mespilus', 'Metasequoia', 'Metrosideros', 'Microstegium', 'Mimosa', 'Mimulus', 'Minuartia', 'Mitella', 'Monarda', 'Moneses', 'Morella', 'Morus', 'Muhlenbergia', 'Myoporum', 'Myrica', 'Myriophyllum', 'Nassella', 'Nolina', 'Nuphar', 'Nymphaea', 'Nyssa', 'Oemleria', 'Oenothera', 'Olea', 'Oligoneuron', 'Olneya', 'Oplopanax', 'Opuntia', 'Orobanche', 'Ostrya', 'Oxalis', 'Oxydendrum', 'Oxyria', 'Panicum', 'Papaver', 'Parkinsonia', 'Parthenocissus', 'Pascopyrum', 'Passiflora', 'Pennisetum', 'Penstemon', 'Persea', 'Petasites', 'Phacelia', 'Phalaris', 'Phellodendron', 'Philadelphus', 'Phlox', 'Phragmites', 'Physocarpus', 'Phytolacca', 'Picea', 'Pinus', 'Pisonia', 'Pithecellobium', 'Platanus', 'Pleuraphis', 'Poa', 'Podophyllum', 'Polemonium', 'Polygonatum', 'Polygonum', 'Poncirus', 'Pontederia', 'Populus', 'Potentilla', 'Prosopis', 'Prunus', 'Pseudobombax', 'Pseudoroegneria', 'Pseudotsuga', 'Pueraria', 'Pulsatilla', 'Punica', 'Purshia', 'Pyrus', 'Quercus', 'Ranunculus', 'Raphanus', 'Ratibida', 'Rhamnus', 'Rhizophora', 'Rhododendron', 'Rhus', 'Ribes', 'Robinia', 'Romneya', 'Rorippa', 'Rosa', 'Rosmarinus', 'Rubus', 'Rudbeckia', 'Sabal', 'Salix', 'Salvia', 'Sambucus', 'Sanguinaria', 'Sarracenia', 'Sassafras', 'Satureja', 'Schizachyrium', 'Schoenoplectus', 'Scilla', 'Scirpus', 'Secale', 'Senna', 'Serenoa', 'Shepherdia', 'Silphium', 'Simmondsia', 'Sisyrinchium', 'Solanum', 'Solidago', 'Sophora', 'Sorbus', 'Sorghastrum', 'Spartium', 'Sphaeralcea', 'Spigelia', 'Spiraea', 'Spondias', 'Sporobolus', 'Sterculia', 'Symphoricarpos', 'Symphyotrichum', 'Symplocarpus', 'Synthyris', 'Syringa', 'Tabebuia', 'Tamarix', 'Taraxacum', 'Taxodium', 'Taxus', 'Tellima', 'Tephrosia', 'Thalictrum', 'Thelesperma', 'Thuja', 'Thymus', 'Tiarella', 'Tilia', 'Tillandsia', 'Toxicodendron', 'Tradescantia', 'Triadica', 'Trientalis', 'Trifolium', 'Trillium', 'Triticum', 'Tsuga', 'Tulipa', 'Tussilago', 'Ulmus', 'Umbellularia', 'Urochloa', 'Urtica', 'Uvularia', 'Vaccinium', 'Vachellia', 'Veratrum', 'Verbesina', 'Vernonia', 'Viburnum', 'Viola', 'Vitex', 'Vitis', 'Wyethia', 'Xerophyllum', 'Yucca', 'Zea', 'Zelkova', 'Zinnia', 'Zizia'
	]

        // view toggles
        vm.moreSearchOptions = false;
        vm.showMap = true;
        vm.spatialLayer = undefined;
        vm.basisOfRecord= undefined;


        vm.params = queryParams;
        vm.map = queryMap;

        vm.queryJson = queryJson;

        function queryJson() {
            $scope.hasPEP725Data = false;
            if ($scope.queryForm.$invalid) return true;
    	    usSpinnerService.spin('query-spinner');
	    var first = true
	    var last = false 
	    var count = 0
	    // loop through selected datasources using the queryParams.source
	    // element
	    for (var key in queryParams.source) {
		// The datasource, e.g. PEP725, NEON, USA-NPN, etc...
		var dataSource=queryParams.source[key]
                queryService.queryJson(queryParams.build(dataSource), 0, SOURCE, dataSource)
                    .then(queryJsonSuccess)
                    .catch(queryJsonFailed)
                    .finally(queryJsonFinally);
	    }

            function queryJsonSuccess(data) {
		// if PEP725 has data then set this flag 
		if (data.source == "PEP725" && data.size > 0) 
  	 		$scope.hasPEP725Data = true;

	        count = count + 1	
		// if this is the first time we update a source, then use update routine
		if (first) {
               	    queryResults.update(data);
		// otherwise append data for all successive calls
		} else {
                    queryResults.append(data);
		}
		first = false;

                queryMap.setMarkers(queryResults.data);
		$scope.queryForm.$setPristine(true)
            }

            function queryJsonFailed(response) {
                alerts.info("Problem loading query results: " + response.message);
                vm.queryResults.isSet = false;
            }

            function queryJsonFinally() {
                usSpinnerService.stop('query-spinner');
            }
        }

   }

})(angular);
