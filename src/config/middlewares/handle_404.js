module.exports = function(req, res) {
	if (req.isAPICall)
		res.status(404).endJson({ error: true, name: "Not found." });
	else
		res.status(404).render('app/404');
}