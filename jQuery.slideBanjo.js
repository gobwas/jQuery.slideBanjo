/*!
 * jQuery.slideBanjo - plugin that shows pretty slides at your site.
 * http://www.gobwas.com/sbanjo
 * Version: 1.05.
 *
 * Copyright 2011, Sergey Kamardin.
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Date: Tue June 27 15:00:00 2011 +0300.
 * Location: Moscow, Russia.
 * Contact: gobwas[a]gobwas.com
 */
 
(function($){
	$.fn.slideBanjo	=	
		function(userSlides,userOptions) {
			if (this[0].tagName!='DIV') return this;
			var temp_a,temp_b,temp_c,temp_d;
			var slideBanjo={
					temp:{
						makeTempObjects:	(function(){
												temp_a=$('<div/>').addClass('sm_menu').appendTo(document.body);
												temp_b=$('<div/>').addClass('sm_menu_current').appendTo(document.body);
												temp_c=$('<div/>').addClass('sm_navis').appendTo(document.body);
												temp_d=$('<div/>').addClass('sm_slide').appendTo(document.body);
												temp_e=$('<div/>').addClass('sm_caption_holder').appendTo(document.body);
						 					})(),
						grid:100,
						a	:  	temp_a.height(),
						b	:	temp_b.height(),
						c	:	temp_c.height(),
						slide: {
									height:temp_d.height(),
									width:temp_d.width() 
						 		},
						captionHolder:	{
							height:temp_e.height(),
							width:temp_e.width()
						},
						deleteTempObjects:	(function(){
												temp_a.remove();temp_b.remove();temp_c.remove();temp_d.remove(); temp_e.remove();
											})()
						}, 
					slide:{
						globalCounter	:	0,
						changeStatus	:	'auto'
					},
					navigation:{
						changeStatus	:	'auto',
						slider			:	false,
						kslider			:	null
					},
					bottom				:	{},
					current				:	null, 
					total				:	userSlides.length, 
					current_pic			:	null, 
					total_pic			:	null, 
					articles			:	[], 
					abstracts			:	[], 
					menus				:	[], 
					arrows				:	[], 
					chs					:	[], 
					contents			:	[],
					blocks				:	[],
					slides_loader		:	[],
					total_loading		:	0,
					total_loaded		:	0,
					slides				:	[], 
					captions			:	[],
					captionToggle		:	true,
					global_div			:	$(this).removeClass().addClass('sm_global'),
					naviST				: 	false,
					timeoutsY			: 	[],
					timeoutsX			:	[],
					timeoutsC			:	[],
					winBlur				: 	false,
					ready				:	false,
					 
					userOptions: {
						navigationScrollTime	:	'auto',
						slideScrollTime			:	5000,
						sliderEasing			: 	'easeInBack',
						easing					:	'easeOutCirc',
						moveSpeed				:	700,
						sliderSpeed				:	500,
						loopX					:	'loop',
						blockEffect				:	'blind',
						blockEffectSpeed		:	300,
						hideMouseOver			:	true,
						hideMouseTime			:	3000,
						innerShadow				: 	true,
						loadingText				:	"Загрузка слайдов.",
						loadPause				:	false
					 }
				};
			 
			$.extend(slideBanjo.userOptions,userOptions);
			$(window).bind('blur',function(){
				slideBanjo.winBlur=true; 
				for (var x in slideBanjo.timeoutsX) {clearTimeout(slideBanjo.timeoutsX.shift());}
				for (var x in slideBanjo.timeoutsY) {clearTimeout(slideBanjo.timeoutsY.shift());}
				for (var x in slideBanjo.timeoutsC) {clearTimeout(slideBanjo.timeoutsC.shift());}
				$(window).bind('focus',function(){
					$(window).unbind('focus');
					slideBanjo.winBlur=false;
					if (slideBanjo.navigation.changeStatus=='auto') {slideBanjo.navigation.autoChange(true);}
					if (slideBanjo.slide.changeStatus=='auto') 		{slideBanjo.slide.autoChange(slideBanjo.slide.globalCounter,true);}
				})});
			//
			//	slideBanjo.draw : this function is a first function of que, it draws a neccessary elements.
			//
			slideBanjo.draw	=	function(){					
				this.banjo_div			=	$('<div/>')		.addClass('sm_banjo')			.appendTo(this.global_div)			.disableSelection();
				this.slide_div			=	$('<div/>')		.addClass('sm_slide_holder')	.appendTo(this.banjo_div);
				
				if (this.userOptions.innerShadow) this.inner_shadow		=	$('<div/>')		.addClass('sm_inner_shadow')	.appendTo(this.slide_div).bind('click',function(){slideBanjo.slide.captionToggle()});
				
				this.slide_caption_div	=	$('<div/>')		.addClass('sm_caption_holder')	.appendTo(this.slide_div);
				
				if (this.userOptions.hideMouseOver) this.slide_caption_div	.bind('mouseover',	function(event){slideBanjo.slide_caption_div.stop().animate({opacity:1});})																											 																			.bind('mouseout',	function(event){
																									slideBanjo.hideMouseFunc()
																								})
																			.bind('mousemove', 	function(){clearTimeout($.data(slideBanjo.slide_caption_div,'timeoutID'));});
				
				this.left_div			=	$('<button/>')	.addClass('sm_left')			.appendTo(this.slide_caption_div)	.bind('click',function(e){slideBanjo.slide.userChange('left',e)});
				this.right_div			=	$('<button/>')	.addClass('sm_right')			.appendTo(this.slide_caption_div)	.bind('click',function(e){slideBanjo.slide.userChange('right',e)});
				this.navigation_div		=	$('<div/>')		.addClass('sm_navis')			.appendTo(this.banjo_div);
				
				this.banjo_div.append($('<div/>').css('clear','both'));
				
				this.loading_div		=	$('<div/>')		.addClass('sm_loading')			.appendTo(this.global_div);
					
				this.drawSlider();
				this.init();
				this.loadSlides();
				this.navigation.autoChange();
			};
			
			//
			//	slideBanjo.drawSlider : this function draws a slider, if number of elements in navigator is higher than div-container.
			//
			slideBanjo.drawSlider=function(){
				if (((this.total-1)*(this.temp.a+1)+this.temp.b)<this.temp.c) return;
				
				this.navigation.kslider=(this.temp.c)/((this.total-1)*(this.temp.a+1)+this.temp.b+this.temp.grid);
				var slider_height=Math.round(this.temp.c*this.navigation.kslider);
				 
				this.slider_bar_div		= 	$('<div/>').addClass('sm_slider_bar').appendTo(this.navigation_div);
				this.slider				= 	$('<div/>').addClass('sm_slider')	.appendTo(this.slider_bar_div)
																				.draggable({ axis	:	"y" , containment: slideBanjo.slider_bar_div ,
																							start	: 	function(){},
																							drag	:	function(event,ui){
																										slideBanjo.global_div.find(".sm_menu").css('top',Math.round(-ui.position.top/slideBanjo.navigation.kslider)+'px');
																									},
																							stop	:	function(){}
																				})
																				.css('height',slider_height+'px');
				slideBanjo.navigation.slider			=	true;
			}
			
			//
			//	slideBanjo.init : this function initializes a neccessary arrays and variables.
			//
			slideBanjo.init	=	function(){	
						
				for (var x in userSlides) {
					this.articles[x]		= 	$('<div/>').addClass('sm_article').html(userSlides[x].name).disableSelection();
					this.abstracts[x]		= 	$('<div/>').addClass('sm_abstract').html(userSlides[x].abstr).disableSelection();
					this.menus[x]			= 	$('<div/>').addClass('sm_menu').append(this.articles[x]).append(this.abstracts[x]).appendTo(this.navigation_div).disableSelection()
															.bind('click',(function(i){return function(){
																slideBanjo.navigation.userChange(i);
															}})(x));
														
					this.chs[x]				= 	$('<div/>').addClass('sm_ch').html(userSlides[x].name).appendTo(this.global_div).disableSelection();
					this.contents[x]		= 	$('<div/>').addClass('sm_content').html(userSlides[x].content).appendTo(this.global_div).disableSelection();
					this.blocks[x]			=	$('<div/>').addClass('sm_blocks').appendTo(this.contents[x]).disableSelection();
					// adding blocks:
					for (var z in userSlides[x].blocks) {
						var div		=	$('<div/>').addClass('sm_block').appendTo(this.blocks[x]);
						var title	=	$('<a/>').addClass('sm_block_title').html(userSlides[x].blocks[z].title).appendTo(div);
						var text	=	$('<div/>').addClass('sm_block_text').html(userSlides[x].blocks[z].text).appendTo(div);
						title.bind('click',(function(a){return function(){a.toggle(slideBanjo.userOptions.blockEffect,slideBanjo.userOptions.blockEffectSpeed);slideBanjo.navigation.changeStatus='user';}})(text));
					}
					
					
					this.arrows[x]			= 	$('<div/>').addClass('sm_arrow').appendTo(this.menus[x]);
							
							
					var slides=[];
					var captions=[];
						for (var y in userSlides[x].pics) {
							this.total_loading++;
							var img=$('<img/>').addClass('sm_slide').css({
																			'left':y*slideBanjo.temp.slide.width+'px',
																			'top':x*slideBanjo.temp.slide.height+'px'
																		})
																	.bind('click',function(){slideBanjo.slide.captionToggle()});
							
							var cpt=$('<div/>').addClass('sm_caption').html(userSlides[x].pics[y].caption).appendTo(this.slide_caption_div);
							
							if (y==0) {
								img.attr({
											title:	userSlides[x].pics[y].caption,
											src:	userSlides[x].pics[y].path
										})
								img.appendTo(this.slide_div);
								slides.push(img);
								captions.push(cpt);
								this.total_loaded++;
							}
							else {
								this.slides_loader.push({x:x, img:img, cpt:cpt,src:	userSlides[x].pics[y].path, pos:y});
							}
																	
							
						}
					
					this.slides[x]=slides;
					this.captions[x]=captions;
				}
				
				this.navishadow			=	$('<div/>').addClass('sm_navishadow').appendTo(this.navigation_div);
				
				var text=this.userOptions.loadingText+' '+String(this.total_loaded)+'/'+String(this.total_loading);
				this.loading_div.html(text);
			};
			
			//
			//	slideBanjo.loadSlides : this function loads slides in background.
			//
			slideBanjo.loadSlides					=	function(){
				for (var y in slideBanjo.slides_loader) {
					var obj= slideBanjo.slides_loader[y];
					obj.img.appendTo(slideBanjo.slide_div).load(
					(function(o){
							return function() {
								slideBanjo.slides[o.x][o.pos]=o.img;
								slideBanjo.captions[o.x][o.pos]=o.cpt;
								if (slideBanjo.current==o.x) slideBanjo.total_pic=slideBanjo.slides[o.x].length;
								if (slideBanjo.current==o.x && slideBanjo.slides[o.x].length>1) slideBanjo.slide.captionButtonsToggle(true);
								slideBanjo.loadProgress();
							}
					})(obj)).attr('src',obj.src);
				}
			};
			
			slideBanjo.loadProgress				=	function(step) {
				this.total_loaded++;
				var text=this.userOptions.loadingText+' '+String(this.total_loaded)+'/'+String(this.total_loading);
				this.loading_div.html(text);
				if (this.total_loaded==this.total_loading) {this.loading_div.fadeOut(100,function(a){return function(){a.remove();}}(this.loading_div)); this.ready=true;}
			}
			
			slideBanjo.test=function(a){alert(a);};
			
			//
			//	slideBanjo.navigation.autoChange : this function starts a autochange cycle for right navigation bar (navigator).
			//
			slideBanjo.navigation.autoChange		=	function(global){
				if (this.changeStatus!='auto' || slideBanjo.winBlur===true) return;
				if ((slideBanjo.current+1)>=slideBanjo.total || slideBanjo.current==null) {
					if (!global) this.changeEffect(0);
				}
				else {
					if (!global) {
						if (slideBanjo.userOptions.loadPause===true){
							if (slideBanjo.ready===true) {
								this.changeEffect(slideBanjo.current+1);
							}
							else {
								for (var x in slideBanjo.timeoutsY) {clearTimeout(slideBanjo.timeoutsY.shift());}
								var k = setTimeout(function(){slideBanjo.navigation.autoChange();},1000);
								slideBanjo.timeoutsY.push(k);
								return;
							}
						}
						else {
							this.changeEffect(slideBanjo.current+1);
						}
					}
				}
				
				if (slideBanjo.userOptions.navigationScrollTime=="auto" || slideBanjo.naviST==true) {slideBanjo.naviST=true;slideBanjo.userOptions.navigationScrollTime=Number(slideBanjo.total_pic*slideBanjo.userOptions.slideScrollTime);}
				if (this.changeStatus=='auto') {
					for (var x in slideBanjo.timeoutsY) {clearTimeout(slideBanjo.timeoutsY.shift());}
					var k = setTimeout(function(){slideBanjo.navigation.autoChange();},slideBanjo.userOptions.navigationScrollTime);
					slideBanjo.timeoutsY.push(k);
				}
			};
			
			//
			//	slideBanjo.navigation.userChange : this function is callback after user's click on some item of navigator.
			//
			slideBanjo.navigation.userChange		=	function(b){
				 	this.changeStatus='user';
					this.changeEffect(b);
				 };
				 
			//
			//	slideBanjo.navigation.changeEffect : this function realize a change effect of navigator's item to status "current".
			//
			slideBanjo.navigation.changeEffect	=	function(b){
				slideBanjo.slide.changeStatus='auto';
				
				if (slideBanjo.current!=null) {
					slideBanjo.menus[slideBanjo.current].removeClass('sm_menu_current');
					slideBanjo.articles[slideBanjo.current].removeClass('sm_article_current');
					slideBanjo.abstracts[slideBanjo.current].removeClass('sm_abstract_current');
					slideBanjo.arrows[slideBanjo.current].removeClass('sm_arrow_current');
				}
					
				slideBanjo.menus[b].stop(false,true).addClass('sm_menu_current');
				slideBanjo.articles[b].addClass('sm_article_current');
				slideBanjo.abstracts[b].addClass('sm_abstract_current');
				slideBanjo.arrows[b].addClass('sm_arrow_current');
					
				slideBanjo.bottom.globalChange(b);
				
				if (slideBanjo.navigation.slider) slideBanjo.navigation.slide(b);
				
				
				slideBanjo.slide.captionChange(b,0);
				
				if (slideBanjo.current!=b) {
					slideBanjo.slide.globalChange(b);
				}
				
				slideBanjo.current=b;
				//if (slideBanjo.userOptions.hideMouseOver) slideBanjo.slide_caption_div.stop().animate({opacity:1}, function(){setTimeout(function(){slideBanjo.slide_caption_div.stop().animate({opacity:0})},1000)});
				if (slideBanjo.userOptions.hideMouseOver) slideBanjo.hideMouseFunc();
			};
			
			//
			//	slideBanjo.navigation.slide : this function realize the movement of slider.
			//
			slideBanjo.navigation.slide = function(b) {
				var top_=slideBanjo.menus[b].position().top; 
				var deltas=null;
				
				if (top_-slideBanjo.temp.grid<=0) {
					var delta=0;
					var st=$(".sm_slider").position().top;
					
					while ((st-Math.round(delta*this.kslider))>0 && ((top_+delta)-slideBanjo.temp.grid)<0) {
						delta+=1;
					}
					deltas=Math.round(-delta*this.kslider);
				}
				else if ((top_+slideBanjo.temp.b+slideBanjo.temp.grid)>slideBanjo.temp.c) {
					delta=slideBanjo.temp.c-(top_+slideBanjo.temp.b+slideBanjo.temp.grid);
					deltas=Math.round(-delta*this.kslider);
				}
				
				if (deltas!=null) {
					slideBanjo.slider.stop().animate({top:slideBanjo.slider.position().top+deltas+'px'},slideBanjo.userOptions.sliderSpeed,slideBanjo.userOptions.sliderEasing);
					slideBanjo.global_div.find(".sm_menu").stop().animate({top:slideBanjo.global_div.find(".sm_menu").position().top+delta+'px'},slideBanjo.userOptions.sliderSpeed,slideBanjo.userOptions.sliderEasing);
				}
			}
			
			//
			//	slideBanjo.slide.autoChange : this function starts a autochange cycle for pictures (slides) in slideholder.
			//
			slideBanjo.slide.autoChange		=	function(gc,global){
				if (slideBanjo.slide.changeStatus!='auto' || gc!=slideBanjo.slide.globalCounter || slideBanjo.winBlur===true) return;
				
				if (!global) slideBanjo.slide.changeEffect('right');

				if (this.changeStatus=='auto') {
						for (var x in slideBanjo.timeoutsX) {
							clearTimeout(slideBanjo.timeoutsX.shift());
						}
					
						var k=setTimeout((function(g){return function(){slideBanjo.slide.autoChange(g);}})(gc),slideBanjo.userOptions.slideScrollTime);
						slideBanjo.timeoutsX.push(k);
						
					}
				
				if (slideBanjo.userOptions.hideMouseOver) slideBanjo.hideMouseFunc();
			};
			
			//
			//	slideBanjo.slide.userChange : this function is callback after user's click on some item of slideholder.
			//
			slideBanjo.slide.userChange		=	function(side,e){
				for (var x in slideBanjo.timeoutsC) {
					clearTimeout(slideBanjo.timeoutsC.shift());
				}
				
				$(e.target).attr('disabled','disabled');
				slideBanjo.slide.changeStatus='user';
				slideBanjo.navigation.changeStatus='user';
				var callb=(function(obj){return function(){$(obj).removeAttr('disabled');}})(e.target);
				this.changeEffect(side, callb);
			};
			
			//
			//	slideBanjo.slide.globalChange : this function is callback after changes in navigator (after selecting new item in navigator).
			//
			slideBanjo.slide.globalChange	=	function(b){
				slideBanjo.total_pic=slideBanjo.slides[b].length;
				slideBanjo.current_pic=0;
				slideBanjo.slide.globalCounter+=1;
				
				for (var y in slideBanjo.slides) {
					for (var x in slideBanjo.slides[y]) {
						slideBanjo.slides[y][x].stop().animate({	top  : (y-b)*slideBanjo.temp.slide.height+'px'},slideBanjo.userOptions.moveSpeed,slideBanjo.userOptions.easing, (function(a,b){ return function(){slideBanjo.slides[a][b].animate({left : b*slideBanjo.temp.slide.width+'px'}, slideBanjo.userOptions.moveSpeed/2,slideBanjo.userOptions.easing)}})(y,x));
					}
				}
				
				if (slideBanjo.total_pic<=1) {
					slideBanjo.slide.captionButtonsToggle(false)
				}
				else {
					slideBanjo.slide.captionButtonsToggle(true);
					slideBanjo.slide.autoChange(slideBanjo.slide.globalCounter,true);
				}
			};
			
			//
			//	slideBanjo.slide.captionChange : this function change caption of slides.
			//
			slideBanjo.slide.captionChange = function(b,c) {
				if (slideBanjo.current!=null) {
					slideBanjo.captions[slideBanjo.current][slideBanjo.current_pic].hide(0);
				}
				
				slideBanjo.captions[b][c].show('slide',slideBanjo.userOptions.moveSpeed);
			}
			
			//
			//	slideBanjo.slide.captionButtonsToggle : this function hides/shows buttons left/right in caption holder.
			//
			slideBanjo.slide.captionButtonsToggle = function (toggle) {
				if (toggle===true) {
					slideBanjo.left_div.removeAttr('disabled').fadeIn(slideBanjo.userOptions.moveSpeed);
					slideBanjo.right_div.removeAttr('disabled').fadeIn(slideBanjo.userOptions.moveSpeed);
				}
				else {
					slideBanjo.left_div.attr('disabled','disabled').fadeOut(slideBanjo.userOptions.moveSpeed);
					slideBanjo.right_div.attr('disabled','disabled').fadeOut(slideBanjo.userOptions.moveSpeed);
				}
			}
			
			//
			//	slideBanjo.slide.captionToggle : this function hides/shows caption of slides.
			//
			slideBanjo.slide.captionToggle = function (toggle) {
				if (toggle==undefined) {
					var toggle=!slideBanjo.captionToggle;
				}
				if (toggle===true) {
					slideBanjo.slide_caption_div.stop().animate({left:'0px', opacity:1},slideBanjo.userOptions.moveSpeed);
					slideBanjo.captionToggle=true;
				} 
				else {
					slideBanjo.slide_caption_div.stop().animate({left:-slideBanjo.temp.captionHolder.width-5+'px',opacity:0.3},slideBanjo.userOptions.moveSpeed);
					slideBanjo.captionToggle=false;
				}
			}
			
			//
			//	slideBanjo.slide.changeEffect : this function realize a changes effect of slideholder's item.
			//
			slideBanjo.slide.changeEffect	=	function(side, callback){
				var simple=false;
				var sign=1;
				
				if (side=='right') {
					if ((slideBanjo.current_pic+1)<slideBanjo.total_pic) {
						slideBanjo.slide.captionChange(slideBanjo.current,slideBanjo.current_pic+1);
						slideBanjo.current_pic+=1;
						simple=true;
					}
				}
				
				if (side=='left') {
					if ((slideBanjo.current_pic-1)>=0) {
						slideBanjo.slide.captionChange(slideBanjo.current,slideBanjo.current_pic-1);
						slideBanjo.current_pic-=1;
						simple=true;
					}
				}
				
				if (simple) {
					for (var x in slideBanjo.slides[slideBanjo.current]) {
						slideBanjo.slides[slideBanjo.current][x].animate({left : (x-slideBanjo.current_pic)*slideBanjo.temp.slide.width+'px'},slideBanjo.userOptions.moveSpeed,slideBanjo.userOptions.easing);	
					}
				}
				else {
					switch (slideBanjo.userOptions.loopX) {
							case 'backward': 
								for (var x in slideBanjo.slides[slideBanjo.current]) {
									slideBanjo.slides[slideBanjo.current][x].animate({left : x*slideBanjo.temp.slide.width+'px'},slideBanjo.userOptions.moveSpeed,slideBanjo.userOptions.easing);
								}
								slideBanjo.slide.captionChange(slideBanjo.current,0);
								slideBanjo.current_pic=0; 
								break;
							case 'loop':
								slideBanjo.captions[slideBanjo.current][slideBanjo.current_pic].fadeOut(0);
								var z=0; var new_s=[]; var new_c=[];
								if (side=='left') {
									z=-1;zz=slideBanjo.slides[slideBanjo.current].length;
									for (var x=slideBanjo.slides[slideBanjo.current].length-1; x>=0; x--) {
										if (x!=slideBanjo.current_pic) {
											z+=1;
											zz-=1;
											slideBanjo.slides[slideBanjo.current][x].css({left : 1-(zz*slideBanjo.temp.slide.width)+'px'});
											new_s[z]=slideBanjo.slides[slideBanjo.current][x];
											new_c[z]=slideBanjo.captions[slideBanjo.current][x];
										}
										else {
											slideBanjo.slides[slideBanjo.current][x].css({left : '0px'});
											new_s[slideBanjo.slides[slideBanjo.current].length-1]=slideBanjo.slides[slideBanjo.current][x];
											new_c[slideBanjo.slides[slideBanjo.current].length-1]=slideBanjo.captions[slideBanjo.current][x];
										}
									}
									slideBanjo.current_pic=slideBanjo.slides[slideBanjo.current].length-1;
								}
								else {
									for (var x in slideBanjo.slides[slideBanjo.current]) {
										if (x!=slideBanjo.current_pic) {
											z+=1;
											slideBanjo.slides[slideBanjo.current][x].css({left : z*slideBanjo.temp.slide.width+'px'});
											new_s[z]=slideBanjo.slides[slideBanjo.current][x];
											new_c[z]=slideBanjo.captions[slideBanjo.current][x];
										}
										else {
											slideBanjo.slides[slideBanjo.current][x].css({left : '0px'});
											new_s[0]=slideBanjo.slides[slideBanjo.current][x];
											new_c[0]=slideBanjo.captions[slideBanjo.current][x];
										}
									}
									slideBanjo.current_pic=0;
								}
								slideBanjo.slides[slideBanjo.current]=new_s;
								slideBanjo.captions[slideBanjo.current]=new_c;
								
								this.changeEffect(side);
							break;
							case 'prohibit' :
								return;
							break;
							
					}
				}
				if (typeof(callback)=='function') setTimeout(callback,slideBanjo.userOptions.moveSpeed);
			};
			
			//
			//	slideBanjo.bottom.globalChange : this function changes main content after selecting a new item in navigator.
			//
			slideBanjo.bottom.globalChange	=	function(b){
				if (slideBanjo.current!=null) {
					slideBanjo.chs[slideBanjo.current].hide();
					slideBanjo.contents[slideBanjo.current].hide();
				}
					 
				slideBanjo.chs[b].show();
				slideBanjo.contents[b].show();
			};
			slideBanjo.hideMouseFunc			=	function() {
				slideBanjo.slide_caption_div.stop().animate({opacity:1}, function(event){
					var k=setTimeout(function(){slideBanjo.slide_caption_div.stop().animate({opacity:0})	},slideBanjo.userOptions.hideMouseTime)
					slideBanjo.timeoutsC.push(k);
				});	
			}
			
			slideBanjo.draw();
			return this;
		}
 })(jQuery);