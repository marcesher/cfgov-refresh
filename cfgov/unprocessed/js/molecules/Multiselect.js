'use strict';

// Required modules.
var arrayHelpers = require( '../modules/util/array-helpers' );
var queryOne = require( '../modules/util/dom-traverse' ).queryOne;
var domCreate = require( '../modules/util/dom-manipulators' ).create;
var strings = require( '../modules/util/strings' );
var bindEvent = require( '../modules/util/dom-events' ).bindEvent;

/**
 * Multiselect
 * @class
 *
 * @classdesc Initializes a new Multiselect molecule.
 *
 * @param {HTMLNode} element
 *   The DOM element within which to search for the molecule.
 * @returns {Object} A Multiselect instance.
 */
function Multiselect( element ) { // eslint-disable-line max-statements, inline-comments, max-len

  // Constants for direction.
  var DIR_PREV = 'prev';
  var DIR_NEXT = 'next';

  // Constants for key binding.
  var KEY_RETURN = 13;
  var KEY_ESCAPE = 27;
  var KEY_UP = 38;
  var KEY_DOWN = 40;
  var KEY_TAB = 9;

  // Search settings.
  var MIN_CHARS = 3;

  // Internal vars.
  var _dom = element;
  var _index = -1;
  var _isBlurSkipped = false;
  var _selections = [];
  var _name;
  var _options;
  var _optionData;
  var _filtered;
  var _placeholder;

  // Markup elems, conver this to templating engine in the future.
  var _container;
  var _choices;
  var _header;
  var _search;
  var _fieldset;
  var _list;

  /**
   * Set up and create the multi-select.
   * @returns {object} The Multiselect instance.
   */
  function init() {
    _name = _dom.name;
    _options = _dom.options || [];
    _placeholder = _dom.getAttribute( 'placeholder' );
    _filtered = _optionData = _sanitizeList( _options );

    for ( var i = 0, l = _filtered.length; i < l; i++ ) {
      if ( _filtered[i].checked ) {
        _selections.push( _filtered[i] );
      }
    }

    if ( _optionData.length > 0 ) {
      _populateMarkup();
      _bindEvents();
      _dom.parentNode.removeChild( _dom );
    }

    return this;
  }

  /**
   * Expand the multi-select drop down.
   * @returns {object} The Multiselect instance.
   */
  function expand() {
    _container.classList.add( 'active' );
    _fieldset.classList.remove( 'u-invisible' );
    _fieldset.setAttribute( 'aria-hidden', false );
    return this;
  }

  /**
   * Collapse the multi-select drop down.
   * @returns {object} The Multiselect instance.
   */
  function collapse() {
    _container.classList.remove( 'active' );
    _fieldset.classList.add( 'u-invisible' );
    _fieldset.setAttribute( 'aria-hidden', true );
    _index = -1;
    return this;
  }

  /**
   * Cleans up a list of options for saving to memory
   * @param   {array} list The options from the parent select elem
   * @returns {array}      An array of option objects
   */
  function _sanitizeList( list ) {
    var item;
    var cleaned = [];

    for ( var i = 0, len = list.length; i < len; i++ ) {
      item = list[i];

      // If the value isn't valid kill the script and propt the developer
      if ( !strings.stringValid( item.value ) ) {
        console.log( '\'' + item.value + '\' is not a valid value' );

        return false;
      }

      cleaned.push( {
        value:   item.value,
        text:    item.text,
        checked: item.defaultSelected
      } );
    }

    return cleaned;
  }

  /**
   * Populates and injects the markup for the custom multi-select
   */
  function _populateMarkup() {
    // Add a container for our markup and hide the default select elem
    _container = domCreate( 'div', {
      className: 'cf-multi-select',
      around:    _dom
    } );

    // Create all our markup but wait to manipulate the DOM just once
    _choices = domCreate( 'ul', {
      className: 'list__unstyled cf-multi-select_choices',
      inside:    _container
    } );

    _selections.forEach( function( option ) {
      var li = domCreate( 'li', {
        'data-option': option.value
      } );

      domCreate( 'label', {
        'for':         option.value,
        'textContent': option.text,
        'className':   'cf-multi-select_label',
        'inside':      li
      } );

      _choices.appendChild( li );
    } );

    _header = domCreate( 'header', {
      className: 'cf-multi-select_header'
    } );

    _search = domCreate( 'input', {
      className:   'cf-multi-select_search',
      type:        'text',
      placeholder: _placeholder || 'Choose up to five',
      inside:      _header,
      id:          _name
    } );

    _fieldset = domCreate( 'fieldset', {
      'className':   'cf-multi-select_fieldset u-invisible',
      'aria-hidden': 'true'
    } );

    _list = domCreate( 'ul', {
      className: 'list__unstyled cf-multi-select_options',
      inside:    _fieldset
    } );

    _optionData.forEach( function( option ) {
      var li = domCreate( 'li', {
        'data-option': option.value
      } );

      var inputData = {
        'id':     option.value,
        // Type must come before value or IE fails
        'type':   'checkbox',
        'value':  option.value,
        'name':   _name,
        'class':  'cf-input cf-multi-select_checkbox',
        'inside': li
      };

      if ( option.checked ) {
        inputData.checked = true;
      }

      domCreate( 'input', inputData );

      domCreate( 'label', {
        'for':         option.value,
        'textContent': option.text,
        'className':   'cf-multi-select_label',
        'inside':      li
      } );

      _list.appendChild( li );
    } );

    // Write our new markup to the DOM
    _container.appendChild( _header );
    _container.appendChild( _fieldset );
  }

  /**
   * Highlights an option in the list
   * @param   {string} direction Direction to highlight compared to the
   *                             current focus
   */
  function _highlight( direction ) {
    var count = _filtered.length;

    if ( direction === DIR_NEXT && _index < count - 1 ) {
      _index += 1;
    } else if ( direction === DIR_PREV && _index > -1 ) {
      _index -= 1;
    }

    if ( _index > -1 ) {
      var value = _filtered[_index].value;
      var item = _list.querySelector( '[data-option="' + value + '"]' );
      var input = item.querySelector( 'input' );

      _isBlurSkipped = true;
      input.focus();
    } else {
      _isBlurSkipped = false;
      _search.focus();
    }
  }

  /**
   * Tracks a user's selections and updates the list in the dom
   * @param   {string} value The value of the option the user has chosen
   */
  function _updateSelections( value ) {
    var optionIndex = arrayHelpers.indexOfObject( _optionData, 'value', value );
    var option = _optionData[optionIndex] || _optionData[_index];

    if ( option ) {
      var selectionIndex = _selections.indexOf( option );
      var li;

      if ( selectionIndex > -1 ) {
        _selections.splice( selectionIndex, 1 );

        if ( _list.classList.contains( 'max-selections' ) ) {
          _list.classList.remove( 'max-selections' );
        }

        li = _choices.querySelector( 'li[data-option="' + option.value + '"]' );

        if ( li ) {
          _choices.removeChild( li );
        }
      } else {
        li = domCreate( 'li', {
          'data-option': option.value
        } );

        domCreate( 'label', {
          'for': option.value,
          'innerHTML': option.text,
          'inside': li
        } );

        _choices.appendChild( li );
        _selections.push( option );

        if ( _selections.length > 4 ) {
          _list.classList.add( 'max-selections' );
        }
      }
    }

    _index = -1;
    _isBlurSkipped = false;

    if ( _fieldset.getAttribute( 'aria-hidden' ) === 'false' ) {
      _search.focus();
    }
  }

  /**
   * Evaluates the list of options based on the user's query in the
   * search input
   * @param  {string} value Text the user has entered in the search query
   */
  function _evaluate( value ) {
    _resetFilter();

    if ( value.length >= MIN_CHARS && _optionData.length > 0 ) {
      _index = -1;

      _filtered = _optionData.filter( function( item ) {
        return strings.stringMatch( item.text, value );
      } );

      _filterResults();
    }
  }

  /**
   * Resets the search input
   */
  function _resetSearch() {
    _search.value = '';
    _resetFilter();
  }

  /**
   * Resets the filtered option list
   */
  function _resetFilter() {
    _list.classList.remove( 'filtered', 'no-results' );

    for ( var i = 0, len = _list.children.length; i < len; i++ ) {
      _list.children[i].classList.remove( 'filter-match' );
    }

    _filtered = _optionData;
  }

  /**
   * Filters the list of options based on the results of the evaluate function
   */
  function _filterResults() {
    _list.classList.add( 'filtered' );
    var item;

    if ( _filtered.length > 0 ) {
      _filtered.forEach( function( option ) {
        item = _list.querySelector( 'li[data-option="' + option.value + '"]' );

        item.classList.add( 'filter-match' );
      } );
    } else {
      _noResults();
    }
  }

  /**
   * Updates the list of options to show the user there are no matching results
   */
  function _noResults() {
    _list.classList.add( 'no-results' );
    _list.classList.remove( 'filtered' );
  }

  /**
   * Binds events to the search input, option list, and checkboxes
   */
  function _bindEvents() {
    var inputs = _list.querySelectorAll( 'input' );

    bindEvent( _search, {
      input: function() {
        _evaluate( this.value );
      },
      focus: function() {
        expand();
      },
      blur: function() {
        if ( !_isBlurSkipped &&
              _fieldset.getAttribute( 'aria-hidden' ) === 'false' ) {
          collapse();
        }
      },
      mousedown: function() {
        if ( _fieldset.getAttribute( 'aria-hidden' ) === 'true' ) {
          expand();
        }
      },
      keydown: function( event ) {
        var key = event.keyCode;

        if ( _fieldset.getAttribute( 'aria-hidden' ) === 'true' &&
             key !== KEY_TAB ) {
          expand();
        }

        if ( key === KEY_RETURN ) {
          event.preventDefault();
          _highlight( DIR_NEXT );
        } else if ( key === KEY_ESCAPE ) {
          _resetSearch();
          collapse();
        } else if ( key === KEY_DOWN ) {
          _highlight( DIR_NEXT );
        } else if ( key === KEY_TAB &&
                    !event.shiftKey &&
                    _fieldset.getAttribute( 'aria-hidden' ) === 'false' ) {
          collapse();
        }
      }
    } );

    bindEvent( _list, {
      mousedown: function() {
        _isBlurSkipped = true;
      },
      keydown: function( event ) {
        var key = event.keyCode;
        var checked = event.target.checked;

        if ( key === KEY_RETURN ) {
          event.preventDefault();
          event.target.checked = !checked;

          queryOne( event.target ).dispatchEvent( 'change' );
        } else if ( key === KEY_ESCAPE ) {
          _search.focus();
          collapse();
        } else if ( key === KEY_UP ) {
          _highlight( DIR_PREV );
        } else if ( key === KEY_DOWN ) {
          _highlight( DIR_NEXT );
        }
      }
    } );

    bindEvent( _fieldset, {
      mousedown: function() {
        _isBlurSkipped = true;
      }
    } );

    for ( var i = 0, len = inputs.length; i < len; i++ ) {
      bindEvent( inputs[i], {
        change: _changeHandler
      } );
    }
  }

  /**
   * Handles the functions to trigger on the checkbox change
   * @param   {object} event The checkbox change event
   */
  function _changeHandler( event ) {
    _updateSelections( event.target.value );
    _resetSearch();
  }

  /**
   * Tests if the user's query matches the text input
   * @param   {string} text  The text to test against
   * @param   {string} value The value the user has entered
   * @returns {boolean}      Returns the boolean result of the test
   */
  function _filterContains( text, value ) {
    return RegExp( _regExpEscape( value.trim() ), 'i' ).test( text );
  }

  /**
   * Escapes a string
   * @param   {string} s The string to escape
   * @returns {string}   The escaped string
   */
  function _regExpEscape( s ) {
    return s.replace( /[-\\^$*+?.()|[\]{}]/g, '\\$&' );
  }

  // Attach public events.
  this.init = init;
  this.expand = expand;
  this.collapse = collapse;

  return this;
}

module.exports = Multiselect;
