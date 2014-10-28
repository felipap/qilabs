
Board = require('./board.coffee')

class Game

	fps = 0
	tps = 0
	lastTic = (new Date)*1 - 1
	lastRender = (new Date)*1 - 1
	fpsFilter = 50
	context = null

	# addFpsCounter = ->
	# 	fpsOut = document.getElementById('fps')
	# 	tpsOut = document.getElementById('tps')
	# 	tics = document.getElementById('tics')
	# 	stopeed = document.getElementById('stopped')
	# 	setInterval =>
	# 		fpsOut.innerHTML = fps.toFixed(1)
	# 		if window.canvasStop
	# 			$(stopped).find('i.fa').addClass('fa-pause')
	# 			$(stopped).find('i.fa').removeClass('fa-play')
	# 			$(stopped).fadeIn()
	# 		else
	# 			$(stopped).find('i.fa').addClass('fa-play')
	# 			$(stopped).find('i.fa').removeClass('fa-pause')
	# 			$(stopped).fadeOut()
	# 		tpsOut.innerHTML = tps.toFixed(1)
	# 		tics.innerHTML = "#{game.board.tics}/#{game.board.params.ticsPerGen}"
	# 	, 100

	# resetFpsCounter = ->
	# 	fps = 0

	_getMousePos: (event) ->
		rect = @canvas.getBoundingClientRect()
		x: event.clientX - rect.left
		y: event.clientY - rect.top

	constructor: ->
		@canvas = document.querySelector "canvas#cellular"
		window.canvas = @canvas
		$parent = $(@canvas.parentElement)
		$parent.height($(document).height()-5)
		@canvas.width = $parent.width()  # window.innerWidth
		@canvas.height = $parent.height() # window.innerHeight
		context = @canvas.getContext("2d")
		window.context = context

		@panel = $("#panel")

		@board = new Board()
		$(@canvas).bind 'click', (event) =>
			@board.showSpecs(@_getMousePos(event))

		window.canvasStop = false
		$(document).keydown (event) =>
			if event.keyCode == 32
				console.log('spacebar hit')
				window.canvasStop = !window.canvasStop
				if window.canvasStop
					@panel.fadeIn()
				else
					@panel.fadeOut()

	loopTic: ->
		now = new Date()

		if not window.canvasStop
			@board.tic(1/50)
			# Synchronise tps
			# thisFrameTPS = 1000 / (now - lastTic)
			# tps += (thisFrameTPS - tps) / 30;
		# else
		# 	tps = 0

		# lastTic = now * 1 - 1
		window.setTimeout((=> @loopTic()), 1000)

	loopRender: ->
		@board.render(context)
		window.AnimateOnFrameRate(=>@loopRender())
		# Synchronise fps
		# thisFrameFPS = 1000 / ((now=new Date) - lastRender)
		# fps += (thisFrameFPS - fps) / 30;
		# lastRender = now * 1 - 1

	start: ->
		# addFpsCounter()
		console.log("Start looping board", @board, "with painter", @)
		@loopTic()
		@loopRender()


window.AnimateOnFrameRate = do ->
	# thanks, Paul Irish
	window.requestAnimationFrame 			or
	window.webkitRequestAnimationFrame		or
	window.mozRequestAnimationFrame			or
	window.oRequestAnimationFrame			or
	window.msRequestAnimationFrame			or
	(callback) ->
		window.setTimeout callback, 10001


window.onload = ->
	# Start the game and loop.
	window.game = new Game
	window.game.start()
	return

$("body").keydown (e) ->
	switch e.keyCode or e.keyCode
		when 37 then window.leftPressed = true
		when 38 then window.upPressed = true
		when 39 then window.rightPressed = true
		when 40 then window.downPressed = true

$("body").keyup (e) ->
	switch e.keyCode or e.keyCode
		when 37 then window.leftPressed = false
		when 38 then window.upPressed = false
		when 39 then window.rightPressed = false
		when 40 then window.downPressed = false