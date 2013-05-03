(function($) {

	var has3d,
	vendor = '',

	// Number of pages in the DOM, minimum value: 6

	pagesInDOM = 6,

	pagePosition = {0: {top: 0, left: 0, right: 'auto', bottom: 'auto'},
					1: {top: 0, right: 0, left: 'auto', bottom: 'auto'}},

	//display options
	displays = ['single', 'double'],

	// Default options

	turnOptions = {

		// First page

		page: 1,
		

		// Duration of transition in milliseconds

		duration: 600,

		// Display

		display: 'double',

		// Events

		when: null
	},
	// Checks if a property belongs to an object

	has = function(property, object){
		return Object.prototype.hasOwnProperty.call(object, property);
	},

	// Gets the CSS3 vendor prefix
	getPrefix = function(){
		var vendorPrefixes = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'],
			len = vendorPrefixes.length;
			vendor = '';

		while(len--)
		{
			if((vendorPrefixes[len]+'Transform') in document.body.style)
			{
				vendor = '-' + vendorPrefixes[len].toLowerCase() + '-';
				
			}
		}
		return vendor;

	},

	turnMethods = {
		init: function(opts){
			if(has3d === undefined){
				has3d = 'WebKitCSSMatrix' in window || 'MozPerspective' in document.body.style; // whether have 3d style
				vendor = getPrefix();//Gets the CSS3 vendor prefix
			}

			var i, len, data = this.data(), ch = this.children();

			opts = $.extend({width: this.width(), height: this.height()}, turnOptions, opts);
			data.opts = opts;
			data.totalPages = 0; //store page total number
			data.pageObjs = {}; // store pages
			data.pageWrap = {}; //store page wrapper

			if(opts.when)
			{
				for(i in opts.when)
				{
					if(has(i, opts.when))
					{
						this.bind(i, opts.when[i]);//bind events provided by index
					}
				}
			}

			this.css({position: 'relative'});
			this.turn('display', opts.display);//set display mode

			len = ch.length;
			for(i = 0; i<len; i++)
			{
				this.turn('addPage', ch[i], i+1);
			}

			this.turn('page', opts.page);

		}, //init end

		// Adds a page from external data
		//!!!!!!!!!!not end

		addPage: function(element, page){
			
			var incPages = false,
				data = this.data(),
				lastPage = data.totalPages + 1;
			
			if(page) {
				if(page == lastPage) {
					page = lastPage;
					incPages = true;
				}
				else if (page>lastPage)
				{
					throw new Error('It is impossible to add the page "'+page+'", the maximum value is: "'+lastPage+'"');
				}
				
			}else{
				page = lastPage;
				incPages = true;
			}

			if(page>=1 && page<=lastPage)
			{

				if(incPages)
				{
					data.totalPages = lastPage; //update number of pages
				}

				data.pageObjs[page] = $(element).addClass('turn-page p' + page);  // Add element

				turnMethods._addPage.call(this, page);// Add page
			}

			return this;
			
		}, // addPage end


		_addPage: function(page){

			var data = this.data(),
				element = data.pageObjs[page];

			if(element){
				if(turnMethods._necessPage.call(this, page)){

					var pageWidth = (data.display=='double')?  this.width()/2 : this.width(),
						pageHeight = this.height();

					element.css({width:pageWidth, height:pageHeight});

					//wrapper
					data.pageWrap[page] = $('<div/>', {'class': 'turn-page-wrapper',
											page: page,
											css: {position: 'absolute',
											overflow: 'hidden',
											width: pageWidth,
											height: pageHeight}}).
											css(pagePosition[(data.display=='double') ? page%2 : 0]);

					this.append(data.pageWrap[page]);

					data.pageWrap[page].prepend(data.pageObjs[page]);
				}
			}



		}, //_addPage end


		// Detects if a page is within the range of `pagesInDOM` from the current view
		_necessPage: function(page){

			if(page === 0){
				return true;
			}
			var range = this.turn('range');

			return page>=range[0] && page<=range[1];

		},//_necessPage end

		
		//return the book page range.
		range: function(page){

			var data = this.data();
			
			return [1, data.totalPages];


		},//range end


		// return the page numbers of the view, 1, 2-3, 4-5, 6

		_view: function(page){

			var data = this.data();

			if(data.display == "double"){
				return (page%2 ? [page-1, page] : [page, page+1]); //whether the page is the odd or even number page of the pager
			}
			else{
				return [page];
			}

		},


		// Gets a view
		view: function(page){
			var data = this.data(), view = turnMethods._view.call(this, page);
			
			return (data.display=='double') ? [(view[0]>0) ? view[0] : 0, (view[1]<=data.totalPages) ? view[1] : 0] : [(view[0]>0 && view[0]<= data.totalPages) ? view[0] : 0];

		},//view end


		//sets or gets the display mode

		//!!!!!!!!!!not end
		display: function(display){

			var data = this.data();

			if(display){

				// whether display is belong to displays.
				if($.isArray(display, displays) == -1){
					throw new Error ('""' + display + '" is not a value for display.');
				}

			data.display = display;

			}

			return this;

		},// display end

		// Gets and sets a page
		page: function(page){

			var data = this.data();

			if(page>0 && page<=data.totalPages) {
				if(!data.done || $.inArray(page, this.turn('view'))!=-1) // if pages are not ready or this page is in current view
				{
					turnMethods._fitPage.call(this, page);
				}else{
					//&&&&&&&&&&&&&&&&&&&
				}
			}
		},//page end


		_fitPage: function(page, ok){

			var data = this.data(), newView = this.turn('view', page);
			this.trigger('turned', [page, newView]);
		}

	},// turnMethods end


	cla = function(that, methods, args){
		//if args is an object
		if(!args[0] || typeof(args[0])=="object"){
			return methods.init.apply(that, args);
		}
		else if(methods[args[0]] && args[0].toString().substr(0, 1)!="_")//if args is a method
		{
			return methods[args[0]].apply(that, Array.prototype.slice.call(args,1));// just transfer the elements from args[1].
		}
	};
	$.extend($.fn, {
		turn: function(req){
			return cla(this, turnMethods, arguments);
		}
	});
	
})(jQuery);
