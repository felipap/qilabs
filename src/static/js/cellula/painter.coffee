
#

module.exports =
	applyCanvasOptions : (type, context, options) ->
		if type is 'fill'
			if 'color' in options then context.fillStyle = options.color
		else if type is 'stroke'
			if 'color' in options then context.strokeStyle = options.color
			if 'width' in options then context.lineWidth = options.width

	###### Canvas manipulation functions
	fillCircle : (context, position, radius=2, options={}) ->
		this.applyCanvasOptions('fill', context, options)
		context.beginPath()
		context.arc(position.x, position.y, radius, 0, 2*Math.PI, true)
		context.fill()
		ctx.closePath();

	drawCircle : (context, position, radius=2, options={}) ->
		this.applyCanvasOptions('stroke', context, options)
		context.beginPath()
		context.arc(position.x, position.y, radius, 0, 2*Math.PI, true)
		context.stroke()

	drawLine : (context, p1, p2, options={}) ->
		this.applyCanvasOptions('stroke', context, options)
		context.strokeStyle = color
		context.lineWidth = lineWidth
		context.beginPath()
		context.moveTo p1.x, p1.y
		context.lineTo p2.x, p2.y
		context.stroke()

	drawTriangle : (context, p1, p2, p3, options={}) ->
		this.applyCanvasOptions('stroke', context, options)
		context.strokeStyle = color
		context.lineWidth = lineWidth
		context.beginPath()
		context.moveTo p1.x, p1.y
		context.lineTo p2.x, p2.y
		context.lineTo p3.x, p3.y
		context.closePath()
		context.stroke()

	drawCenteredPolygon : (context, center, points, angle=0, options={}) ->
		this.applyCanvasOptions('stroke', context, options)
		context.beginPath()
		context.moveTo(points[0].x, points[0].y)
		for point in points[1..]
			context.lineTo(point.x,point.y)
		context.closePath()
		context.fill()

	# Draws a polygon.
	# Won't take angle arg, because it is necessary to have the rotation center.
	# For that, use drawCenteredPolygo
	drawPolygon : (context, points, options={}) ->
		this.applyCanvasOptions('stroke', context, options)
		context.beginPath()
		context.moveTo(points[0].x, points[0].y)
		for point in points[1..]
			context.lineTo(point.x,point.y)
		context.lineTo(points[0].x, points[0].y)
		context.closePath()
		context.fill()

	# Draws a rectangle between two points.
	drawRectangle : (context, p1, p2, options={}) ->
		this.applyCanvasOptions('stroke', context, options)
		context.rect(p1.x, p1.y, p2.x-p1.x, p2.y-p2.y)
		context.stroke()

	# Fills a rectangle between two points.
	fillRectangle : (context, p1, p2, angle=0, options={}) ->
		this.applyCanvasOptions('fill', context, options)
		if angle
			context.save()
			context.translate((p1.x+p2.x)/2, (p1.y+p2.y)/2) # Translate center of canvas to center of figure.
			context.rotate(angle)
			context.fillRect(p1.x, p1.y, p2.x-p1.x, p2.y-p1.y)
			context.restore()
		else # optimize for angle=0?
			context.fillRect(p1.x, p1.y, p2.x-p1.x, p2.y-p1.y)

	# Fills a rectangle using the center and size (x:width,y:height) as paramenters.
	fillCenteredRect : (context, point, size, options={}) ->
		this.applyCanvasOptions('fill', context, options)
		context.fillStyle = color
		if angle
			context.save()
			context.translate(point.x, point.y) # Translate center of canvas to center of figure.
			context.rotate(angle)
			context.fillRect(-size.x/2, -size.y/2, size.x, size.y)
			context.restore()
		else # optimize for angle=0?
			context.fillRect(point.x-size.x/2, point.y-size.y/2, size.x, size.y)