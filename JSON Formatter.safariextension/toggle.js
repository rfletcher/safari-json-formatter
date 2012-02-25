(function($){
	$(document).on('click','.toggle',function(e){
		$(e.target).toggleClass('closed');
	})
})(jQuery);