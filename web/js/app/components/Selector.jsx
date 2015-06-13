
var React = require('react');
var $ = require('jquery');
require('autosize');

var Selector = React.createClass({
  componentDidMount: function() {
    $(this.refs.select.getDOMNode()).on('change', (e) => {
      // It would be much cleaner to do
      // this.trigger('change', { value: this.getValue() });
      // but apparently `http://stackoverflow.com/a/22365551/396050`
      if (this.props.onChange) {
        this.props.onChange(this.getValue());
      }
    });
  },

  getValue: function() {
    return this.refs.select.getDOMNode().value;
  },

  render: function() {
    return (
      <div className={"input-Select "+
        (this.props.className||"")+
        (this.props.icon&&" has-icon")}
        title={this.props.title}>
        {
          this.props.icon?
          <i className={this.props.icon}></i>
          :null
        }
        <select ref="select"
          defaultValue={this.props.defaultValue}
          onChange={this.onChangeLab}>
          {
            this.props.label?
            <option value="false">{this.props.label}</option>
            :null
          }
          {this.props.options}
        </select>
      </div>
    );
  }
});

module.exports = Selector;