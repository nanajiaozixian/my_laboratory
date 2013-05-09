(function($) {

	var has3d,
	vendor = '',

	// Gets basic attributes for a layer

	divAtt = function(top, left, zIndex, overf) {
		return {'css': {
					position: 'absolute',
					top: top,
					left: left,
					'overflow': overf || 'hidden',
					'z-index': zIndex || 'auto'
					}
			};
	},//end divAtt


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
	}, // end turnOptions


	flipOptions = {

		//back page

		folding: null,

		// Corners
		// backward: Activates both tl and bl corners
		// forward: Activates both tr and br corners
		// all: Activates all the corners

		corners: 'forward',

		// Size of the active zone of each corner

		cornerSize: 100
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


	/*********turnMethods***********/
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
			data.pagePlace = {};//store current view pages places
			data.pages = {}; //store flip pages

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

			//Add pages

			if(opts.page)
			{
				data.page = opts.page;
			}

			len = ch.length;
			for(i = 0; i<len; i++)
			{
				this.turn('addPage', ch[i], i+1);
			}


			//set corner flip effect

			$(this).bind(events.start, function(e){
				for(var page in data.pages)
				{
					if (has(page, data.pages) && flipMethods._eventStart.call(data.pages[page])===false)
					{
						return false;
					}
				}
			}) ;


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

					// Place pages
					data.pagePlace[page] = page;

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

				//If the page is in the current view, create the flip effect
				if(!page || turnMethods._setPageLoc.call(this, page)==1) //_setPageLoc set the page's z-index
				{
					turnMethods._makeFlip.call(this, page);// set flip effect for current page.
				}else{
					data.pagePlace[page] = 0; //if the page isn't in the current view, data.pagePlace[page] needs to be set 0
				}
			}



		}, //_addPage end

		_setPageLoc: function(page){

			var data = this.data(),
				view = this.turn('view');


			if(page==view[0] || page==view[1]) {
				data.pageWrap[page].css({'z-index': pagesInDOM, display: ''});
				return 1;
			}else if((data.display=='single' && page==view[0]+1) || (data.display=='double' && page==view[0]-2 || page==view[1]+2)){
				data.pageWrap[page].css({'z-index': pagesInDOM-1, display: ''});
				return 2;
			}else {
				data.pageWrap[page].css({'z-index': 0, display: 'none'});
				return 0;
			}
				
		},


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
			page = page || data.page; // if the page is not given, then we can use data.page

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
					//turnMethods._fitPage.call(this, page);
				}else{
					//&&&&&&&&&&&&&&&&&&&
				}
				return this;
			}
		},//page end


		_fitPage: function(page, ok){

			var data = this.data(), newView = this.turn('view', page);
			//this.trigger('turned', [page, newView]);

			if(!data.pageObjs[page]){
				return;
			}

			//data.tpage is a temporary parameter for data.page
			data.tpage = page;

			this.turn('stop', ok);

		},//_fitPage end


		// Stops animations

		stop: function(ok) {

			var data = this.data();

			if(data.tpage) {

				//init data.page
				data.page = data.tpage;
				delete data['tpage'];
			}

			this.turn('update');

		}, // stop end


		// Prepares the flip effect for a page

		_makeFlip: function(page) {

			var data = this.data();

			if(!data.pages[page] && data.pagePlace[page]==page) {
				var single = data.display=='single';
				even = page%2;

				data.pages[page] = data.pageObjs[page];
				
				var tempPage = data.pages[page];
				tempPage.css({width: (single) ? this.width(): this.width()/2, height: this.height()});
				tempPage.flip({page: page,
							next: (single && page === data.totalPages)? page-1 : ((even || single) ? page+1 :page-1),
							turn: this,
							corner: (single)?'all':(even?'forword':'backword')});

			}
		}

	},// turnMethods end


	/*****************flipMethods******************/

	// Methods and properties for the flip page effect

	flipMethods = {
		
		init: function(opts) {
			
			this.data({f: {}}); //init data.f
			this.flip('options', opts);
			
			flipMethods._addPageWrapper.call(this);

			return this;

		}, // end init


		//store options to data.f

		options: function(opts){

			var data = this.data().f;

			if(opts) {

				flipMethods.setData.call(this, {opts: $.extend({}, data.opts || flipOptions, opts)});

				return this;

			} else{
				return data.opts;
			}
		}, //end option




		// set options to data.f
		setData: function(d) {

			var data = this.data();

			data.f = $.extend(data.f, d);

			return this;
		}, //end setData


		// Prepares the page by adding a general wrapper and another objects

		_addPageWrapper: function() {

			var data = this.data().f,
				parent = this.parent();

			if(!data.wrapper) {

				var left = this.css('left'),
					top  = this.css('top'),
					width = this.width(),
					height = this.height();

				data.parent = parent;
				data.fparent = (data.opts.turn) ? data.opts.turn.data().fparent : $('#turn-fwrappers');



				//create fparent to contain the flip effect div 

				if(!data.fparent) {
					var fparent = $('<div/>', {css: {'pointer-events': 'none' //prevent accept mouse event
					}}).hide();

					if(data.opts.turn) {

						var tcss = divAtt(-data.opts.turn.offset().top, -data.opts.turn.offset().left, 'auto', 'visible').css; //set fparent css
						fparent.css(tcss).appendTo(data.opts.turn);// put fparent under main div

						data.opts.turn.data().fparent = fparent; 
					}else {
						//&&&&&&&&&&&&&&&&
					}

					data.fparent = fparent;
				}

				this.css({position: 'absolute', top: 0, left: 0, bottom: 'auto', right: 'auto'});


				// create wrapper div contain turn-page
				data.wrapper = $('<div/>', divAtt(0, 0, this.css('z-index'))).addClass('wrapper').appendTo(parent).prepend(this);


				//create fwrapper
				data.fwrapper = $('<div/>', divAtt(parent.offset().top, parent.offset().left)).addClass("fwrapper").hide().appendTo(data.fparent);

				//create a div to contain back page
				data.fpage = $('<div/>', {css: {cursor: 'default'}}).addClass("fpage").appendTo($('<div/>', divAtt(0, 0, 0, 'visible')).appendTo(data.fwrapper));

				data.ashadow = $('<div/>', divAtt(0, 0, 1)).appendTo(data.fpage);


				// Save data

				flipMethods.setData.call(this, data);

				// Set size
				flipMethods.resize.call(this, true);
			}
		}, // end _addPageWrapper

		
		// Resize each page
		resize: function() {

			//var data = this.data();


			
			//if(data.pages[0]) {  

				////resize flip pages
				//data.pageWrap[0].css({left: -this.width()});
				//data.pages[0].flip('resize', true);
			//}
		}, //end resize


		resize: function(full) {

			var data = this.data().f,
				width = this.width(),
				height = this.height(),
				size = Math.round(Math.sqrt(Math.pow(width,  2)+Math.pow(height, 2))); // wrapper's width must can contain a page's widthest side

			if(full) {
				data.wrapper.css({width: size, height: size});
				data.fwrapper.css({width: size, height: size}).children(':first-child').css({width: width, height: height});

				data.fpage.css({width: height, height: width});

				data.ashadow.css({width: height, height: width});

			}
		},//end resize


	}, //end flipMethods


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
		},//end turn

		flip: function(req, opts){
			return cla(this, flipMethods, arguments);
		} //end flip
	});
	
})(jQuery);
