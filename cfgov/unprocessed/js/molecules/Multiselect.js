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
  var MAX_SELECTIONS = 5;

  // Internal vars.
  var _dom = element;
  var _index = -1;
  var _isBlurSkipped = false;
  var _selectionsCount = 0;
  var _name;
  var _options;
  var _optionsData;
  var _filteredData;
  var _placeholder;

  // Markup elems, conver this to templating engine in the future.
  var _containerDom;
  var _selectionsDom;
  var _headerDom;
  var _searchDom;
  var _fieldsetDom;
  var _optionsDom;

  /**
   * Set up and create the multi-select.
   * @returns {object} The Multiselect instance.
   */
  function init() {
    _name = _dom.name;
    _options = _dom.options || [];
    _placeholder = _dom.getAttribute( 'placeholder' );
    _filteredData = _optionsData = _sanitizeOptions( _options );

    if ( _optionsData.length > 0 ) {
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
    _containerDom.classList.add( 'active' );
    _fieldsetDom.classList.remove( 'u-invisible' );
    _fieldsetDom.setAttribute( 'aria-hidden', false );
    return this;
  }

  /**
   * Collapse the multi-select drop down.
   * @returns {object} The Multiselect instance.
   */
  function collapse() {
    _containerDom.classList.remove( 'active' );
    _fieldsetDom.classList.add( 'u-invisible' );
    _fieldsetDom.setAttribute( 'aria-hidden', true );
    _index = -1;
    return this;
  }

  /**
   * Cleans up a list of options for saving to memory
   * @param   {array} list The options from the parent select elem
   * @returns {array}      An array of option objects
   */
  function _sanitizeOptions( list ) {
    var item;
    var cleaned = [];

    for ( var i = 0, len = list.length; i < len; i++ ) {
      item = list[i];

      // If the value isn't valid kill the script and prompt the developer.
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
    // Add a container for our markup
    _containerDom = domCreate( 'div', {
      className: 'cf-multi-select',
      around:    _dom
    } );

    // Create all our markup but wait to manipulate the DOM just once
    _selectionsDom = domCreate( 'ul', {
      className: 'list__unstyled cf-multi-select_choices',
      inside:    _containerDom
    } );

    _headerDom = domCreate( 'header', {
      className: 'cf-multi-select_header'
    } );

    _searchDom = domCreate( 'input', {
      className:   'cf-multi-select_search',
      type:        'text',
      placeholder: _placeholder || 'Choose up to five',
      inside:      _headerDom,
      id:          _name
    } );

    _fieldsetDom = domCreate( 'fieldset', {
      'className':   'cf-multi-select_fieldset u-invisible',
      'aria-hidden': 'true'
    } );

    _optionsDom = domCreate( 'ul', {
      className: 'list__unstyled cf-multi-select_options',
      inside:    _fieldsetDom
    } );

    _optionsData.forEach( function( option ) {
      var _optionsItemDom = domCreate( 'li', {
        'data-option': option.value
      } );

      domCreate( 'input', {
        'id':     option.value,
        // Type must come before value or IE fails
        'type':    'checkbox',
        'value':   option.value,
        'name':    _name,
        'class':   'cf-input cf-multi-select_checkbox',
        'inside':  _optionsItemDom,
        'checked': option.checked
      } );

      domCreate( 'label', {
        'for':         option.value,
        'textContent': option.text,
        'className':   'cf-multi-select_label',
        'inside':      _optionsItemDom
      } );

      _optionsDom.appendChild( _optionsItemDom );

      if ( option.checked ) {
        var selectionsItemDom = domCreate( 'li', {
          'data-option': option.value
        } );

        domCreate( 'label', {
          'for':         option.value,
          'textContent': option.text,
          'className':   'cf-multi-select_label',
          'inside':      selectionsItemDom
        } );

        _selectionsDom.appendChild( selectionsItemDom );
        _selectionsCount += 1;
      }
    } );

    // Write our new markup to the DOM
    _containerDom.appendChild( _headerDom );
    _containerDom.appendChild( _fieldsetDom );
  }

  /**
   * Highlights an option in the list
   * @param   {string} direction Direction to highlight compared to the
   *                             current focus
   */
  function _highlight( direction ) {
    var count = _filteredData.length;

    if ( direction === DIR_NEXT && _index < count - 1 ) {
      _index += 1;
    } else if ( direction === DIR_PREV && _index > -1 ) {
      _index -= 1;
    }

    if ( _index > -1 ) {
      var value = _filteredData[_index].value;
      var item = _optionsDom.querySelector( '[data-option="' + value + '"]' );
      var input = item.querySelector( 'input' );

      _isBlurSkipped = true;
      input.focus();
    } else {
      _isBlurSkipped = false;
      _searchDom.focus();
    }
  }

  /**
   * Tracks a user's selections and updates the list in the dom
   * @param   {string} value The value of the option the user has chosen
   */
  function _updateSelections( value ) {
    var optionIndex =
      arrayHelpers.indexOfObject( _optionsData, 'value', value );
    var option = _optionsData[optionIndex] || _optionsData[_index];

    if ( option ) {
      var _selectionsItemDom;

      if ( option.checked ) {
        if ( _optionsDom.classList.contains( 'max-selections' ) ) {
          _optionsDom.classList.remove( 'max-selections' );
        }

        var dataOptionSel = '[data-option="' + option.value + '"]';
        _selectionsItemDom = _selectionsDom.querySelector( dataOptionSel );

        if ( _selectionsItemDom ) {
          _selectionsDom.removeChild( _selectionsItemDom );
        }
        option.checked = false;
        _selectionsCount -= 1;
      } else {
        _selectionsItemDom = domCreate( 'li', {
          'data-option': option.value
        } );

        domCreate( 'label', {
          'for':       option.value,
          'innerHTML': option.text,
          'inside':    _selectionsItemDom
        } );

        _selectionsDom.appendChild( _selectionsItemDom );

        option.checked = true;
        _selectionsCount += 1;

        if ( _selectionsCount >= MAX_SELECTIONS ) {
          _optionsDom.classList.add( 'max-selections' );
        }
      }
    }

    _index = -1;
    _isBlurSkipped = false;

    if ( _fieldsetDom.getAttribute( 'aria-hidden' ) === 'false' ) {
      _searchDom.focus();
    }
  }

  /**
   * Evaluates the list of options based on the user's query in the
   * search input
   * @param  {string} value Text the user has entered in the search query
   */
  function _evaluate( value ) {
    _resetFilter();

    if ( value.length >= MIN_CHARS && _optionsData.length > 0 ) {
      _index = -1;

      _filteredData = _optionsData.filter( function( item ) {
        return strings.stringMatch( item.text, value );
      } );

      _filterResults();
    }
  }

  /**
   * Resets the search input and filtering
   */
  function _resetSearch() {
    _searchDom.value = '';
    _resetFilter();
  }

  /**
   * Resets the filtered option list
   */
  function _resetFilter() {
    _optionsDom.classList.remove( 'filtered', 'no-results' );

    for ( var i = 0, len = _optionsDom.children.length; i < len; i++ ) {
      _optionsDom.children[i].classList.remove( 'filter-match' );
    }

    _filteredData = _optionsData;
  }

  /**
   * Filters the list of options based on the results of the evaluate function
   */
  function _filterResults() {
    _optionsDom.classList.add( 'filtered' );
    var _optionsItemDom;

    if ( _filteredData.length > 0 ) {
      _filteredData.forEach( function( option ) {
        _optionsItemDom =
          _optionsDom.querySelector( '[data-option="' + option.value + '"]' );

        _optionsItemDom.classList.add( 'filter-match' );
      } );
    } else {
      _noResults();
    }
  }

  /**
   * Updates the list of options to show the user there are no matching results
   */
  function _noResults() {
    _optionsDom.classList.add( 'no-results' );
    _optionsDom.classList.remove( 'filtered' );
  }

  /**
   * Binds events to the search input, option list, and checkboxes
   */
  function _bindEvents() {
    var inputs = _optionsDom.querySelectorAll( 'input' );

    bindEvent( _searchDom, {
      input: function() {
        _evaluate( this.value );
      },
      focus: function() {
        expand();
      },
      blur: function() {
        if ( !_isBlurSkipped &&
              _fieldsetDom.getAttribute( 'aria-hidden' ) === 'false' ) {
          collapse();
        }
      },
      mousedown: function() {
        if ( _fieldsetDom.getAttribute( 'aria-hidden' ) === 'true' ) {
          expand();
        }
      },
      keydown: function( event ) {
        var key = event.keyCode;

        if ( _fieldsetDom.getAttribute( 'aria-hidden' ) === 'true' &&
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
                    _fieldsetDom.getAttribute( 'aria-hidden' ) === 'false' ) {
          collapse();
        }
      }
    } );

    bindEvent( _optionsDom, {
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
          _searchDom.focus();
          collapse();
        } else if ( key === KEY_UP ) {
          _highlight( DIR_PREV );
        } else if ( key === KEY_DOWN ) {
          _highlight( DIR_NEXT );
        }
      }
    } );

    bindEvent( _fieldsetDom, {
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

  // Attach public events.
  this.init = init;
  this.expand = expand;
  this.collapse = collapse;

  return this;
}

module.exports = Multiselect;
