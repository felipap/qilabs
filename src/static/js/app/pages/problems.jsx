/** @jsx React.DOM */

var $ = require('jquery')
var models = require('../components/models.js')
var React = require('react')
var _ = require("underscore")
var selectize = require('selectize')

var Header = React.createClass({

	getInitialState: function () {
		return { changed: false };
	},

	componentDidMount: function () {
		//
		var t = $(this.refs.topic.getDOMNode()).selectize({
			plugins: ['remove_button'],
			maxItems: 5,
			multiple: true,
			labelField: 'name',
			valueField: 'id',
			searchField: 'name',
			options: [
				{ name: 'Álgebra', id: 'algebra', },
				{ name: 'Combinatória', id: 'combinatorics', },
				{ name: 'Geometria', id: 'geometry', },
				{ name: 'Teoria dos Números', id: 'number-theory', }
			],
		});
		t[0].selectize.addItem('algebra')
		t[0].selectize.addItem('combinatorics')
		t[0].selectize.addItem('geometry')
		t[0].selectize.addItem('number-theory')
		t[0].selectize.on('change', this.onChangeSelect);
		//
		var l = $(this.refs.level.getDOMNode()).selectize({
				plugins: ['remove_button'],
				maxItems: 5,
				multiple: true,
				labelField: 'name',
				valueField: 'id',
				searchField: 'name',
				options: [
					{ name: 'Nível 1', id: 1, },
					{ name: 'Nível 2', id: 2, },
					{ name: 'Nível 3', id: 3, },
				],
		});
		l[0].selectize.addItem(1)
		l[0].selectize.addItem(2)
		l[0].selectize.addItem(3)
		l[0].selectize.on('change', this.onChangeSelect);
	},

	onChangeSelect: function () {
		this.setState({ changed: true });
	},

	query: function () {
		var topic = this.refs.topic.getDOMNode().selectize.getValue(),
				level = this.refs.level.getDOMNode().selectize.getValue();

		this.props.onQuery({ level: level, topic: topic },
			function () {
				this.setState({ changed: false })
			}.bind(this)
		)
	},

	render: function () {

		return (
			<div>
				<div className="label">
					Mostrando problemas
				</div>

				<select ref="topic" className="select-topic">
				</select>

				<select ref="level" className="select-level">
				</select>

				<button className="new-problem"
					data-trigger="component" data-component="createProblem">
					Novo Problema
				</button>

				{
					this.state.changed?
					<button className="query" onClick={this.query}>
						Procurar
					</button>
					:<button disabled className="query">
						Procurar
					</button>
				}
			</div>
		);
	},
})


module.exports = function (app) {

	function changeQuery (data, cb) {
		console.log(arguments)
		app.postList.once('reset', function () {
			cb();
		})
		app.renderWall('/api/labs/all/problems',
			{ level: data.level, topic: data.topic })
	}


	React.renderComponent(<Header onQuery={changeQuery} />,
		document.getElementById('qi-header'));

	if (window._profileLoaded)
		return;

	window._profileLoaded = true;

	$("[data-action=edit-profile]").click(function () {
		$(".profileWrapper").addClass('editing');
	});
	$("[name=name1], [name=name2]").on('keydown', function (e) {
		if (e.keyCode == 32) {
			e.preventDefault();
		}
	});
	// Defer: allow page to render first (so that tooltip position is correct)
	setTimeout(function () {
		$('[data-action="edit-profile"]').tooltip('show');
	}, 1);
	$('.autosize').autosize();
	$("[data-action=save-profile]").click(function () {
		var profile = {
			bio: $("[name=bio]").val(),
			nome1: $("[name=name1]").val(),
			nome2: $("[name=name2]").val(),
			home: $("[name=home]").val(),
			location: $("[name=location]").val(),
		};

		$.ajax({
			type: 'PUT',
			dataType: 'JSON',
			url: '/api/me/profile',
			data: {
				profile: profile
			}
		}).done(function (response) {
			if (response.error) {
				if (response.message) {
					app.flash.alert(response.message);
				} else {
					console.warn('????',response);
				}
			} else if (response.data) {
				var me = response.data;
				$(".profileWrapper").removeClass('editing');
				$(".profileOutput.bio").html(me.profile.bio);
				$(".profileOutput.name").html(me.name);
				$(".profileOutput.home").html(me.profile.home);
				$(".profileOutput.location").html(me.profile.location);
			} else {
				app.flash.alert("Um erro pode ter ocorrido.");
			}
		}).fail(function () {
		});
	})
};