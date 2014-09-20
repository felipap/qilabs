
// From http://detectmobilebrowsers.com
(function detectMobile (a,b){
	if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) {
		window._isMobile = true;
		document.body.className += " mobile";
		return true;
	}
	window._isMobile = false;
	return false;
})(navigator.userAgent||navigator.vendor||window.opera)

window.calcTimeFrom = function (arg, short) {
	var now = new Date(),
		then = new Date(arg),
		diff = now-then;

	if (diff < 1000*60) {
		return 'agora';
	} else if (diff < 1000*60*60) {
		var m = Math.floor(diff/1000/60);
		return short?'há '+m+'m':'há '+m+' minuto'+(m>1?'s':'');
	} else if (diff < 1000*60*60*30) { // até 30 horas
		var m = Math.floor(diff/1000/60/60);
		return short?'há '+m+'h':'há '+m+' hora'+(m>1?'s':'');
	} else if (diff < 1000*60*60*24*14) {
		var m = Math.floor(diff/1000/60/60/24);
		return short?'há '+m+'d':'há '+m+' dia'+(m>1?'s':'');
	} else {
		var m = Math.floor(diff/1000/60/60/24/7);
		return short?'há '+m+'sem':'há '+m+' semana'+(m>1?'s':'');
	}
};
require('es5-shim')

var $ = require('jquery')
var modernizr = require('modernizr')
var plugins = require('./plugins.js')
var bootstrap_tooltip = require('../vendor/bootstrap/tooltip.js')
var bootstrap_button = require('../vendor/bootstrap/button.js')
var bootstrap_dropdown = require('../vendor/bootstrap/dropdown.js')
var bell = require('./components/bell.js')

$("body").tooltip({selector:'[data-toggle=tooltip]'});
$("[data-toggle=dialog]").xdialog();
$('.btn').button();

(function setCSRFToken () {
	$.ajaxPrefilter(function(options, _, xhr) {
		if (!options.crossDomain) {
			xhr.setRequestHeader('X-CSRF-Token',
				$("meta[name='csrf-token']").attr('content'));
		}
	});
})();

// Part of a snpage-only functionality
// Hide popover when mouse-click happens outside of it.
$(document).mouseup(function (e) {
	var container = $('#sidebarPanel');
	if ($('body').hasClass('sidebarOpen')) {
		if (!container.is(e.target) && container.has(e.target).length === 0 && 
			!$('#openSidebar').is(e.target) && $('#openSidebar').has(e.target).length === 0) {
			$('body').removeClass('sidebarOpen');
		}
	}
});
// $(document).keydown(function(e){
// 	if (e.keyCode == 32) {
// 		$('body').toggleClass('sidebarOpen');
// 		return false;
// 	}
// });
$(document).on('click', '#openSidebar', function (e) {
	$('body').toggleClass('sidebarOpen');
});

$('body').on("click", ".btn-follow", function (evt) {
	var action = this.dataset.action;
	if (action !== 'follow' && action !== 'unfollow')
		throw "What?";

	var neew = (action==='follow')?'unfollow':'follow';
	if (this.dataset.user) {
		$.post('/api/users/'+this.dataset.user+'/'+action, function (data) {
			if (data.error) {
				alert(data.error);
			} else {
				this.dataset.action = neew;
			}
		}.bind(this));
	}
});

$('body').on('click', '[data-trigger=component]', function (e) {
	e.preventDefault();
	// Call router method
	var dataset = this.dataset;
	// Too coupled. This should be implemented as callback, or smthng. Perhaps triggered on navigation.
	$('body').removeClass('sidebarOpen');
	if (dataset.route) {
		var href = $(this).data('href') || $(this).attr('href');
		if (href)
			console.warn('Component href attribute is set to '+href+'.');
		app.navigate(href, {trigger:true, replace:false});
	} else {
		if (typeof app === 'undefined' || !app.components) {
			if (dataset.href)
				window.location.href = dataset.href;
			else
				console.error("Can't trigger component "+dataset.component+" in unexistent app object.");
			return;
		}
		if (dataset.component in app.components) {
			var data = {};
			if (dataset.args) {
				try {
					data = JSON.parse(dataset.args);
				} catch (e) {
					console.error('Failed to parse data-args '+dataset.args+' as JSON object.');
					console.error(e.stack);
				}
			}
			app.components[dataset.component].call(app, data);
		} else {
			console.warn('Router doesn\'t contain component '+dataset.component+'.')
		}
	}
});

// GOSTAVA TANTO DE NUTELLA
	
$("a[data-ajax-post-href],button[data-ajax-post-href]").click(function () {
	var href = this.dataset['ajaxPostHref'],
		redirect = this.dataset['redirectHref'];
	$.post(href, function () {
		if (redirect)
			window.location.href = redirect;
		else
			window.location.reload();
	});
});