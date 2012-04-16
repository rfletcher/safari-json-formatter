( function() {
  var settings = {}, formatJSON = {
    /**
     * attempt to reformat the current document as JSON
     *  TODO: examine the document's content-type (appears to be impossible)
     */
    init: function() {
      // abort if framed (issue #7)
      if( window !== window.top ) {
        return;
      }

      // receive settings from proxy.html
      safari.self.addEventListener( "message", function( e ) {
        if( e.name === "setData" ) {
          var data = e.message;
          settings = data.settings;

          // attempt to parse the body as JSON
          try {
            var s = document.body.textContent;
            if ( settings.unescape_unicode ) {
              s = JSON.stringify( JSON.parse( s ) );
            }
            var obj = JSON.parse( s
              .split( "\\" ).join( "\\\\" ) // double-up on escape sequences
              .split( '\\\"' ).join( "\\\\\"" ) // at this point quotes have been unescaped.  re-escape them.
            );
          } catch( e ) {
            // invalid JSON :(
            return;
          }

          formatJSON.preparePage();
          formatJSON.addStyle( data.css );
          formatJSON.addToolbar( data.toolbar );
          formatJSON.renderRoot( obj );
          formatJSON.handleEvents();
        }
      }, false );

      // ask proxy.html for settings
      safari.self.tab.dispatchMessage( "getData" );
    },

    /**
     * append child nodes to a parent node
     *  _append( <ul/>, <li/> ) => <ul><li/></ul>
     *  _append( <ul/>, [<li/>, <li/>] ) => <ul><li/><li/></ul>
     */
    _append: function( parent, child ) {
      if( this._typeof( child ) != "array" ) {
        child = [child];
      }
      for( var i = 0, ii = child.length; i < ii; i++ ) {
        parent.appendChild( child[i] );
      }
      return parent;
    },

    /**
     * convert an html string into one or more nodes
     *  _html( "<div/>" ) => <div/>
     *  _html( "<div/>", "<div/>" ) => [<div/>, <div/>]
     */
    _html: function( str ) {
      var nodes = [];

      for( var i = 0, ii = arguments.length; i < ii; i++ ) {
        if( this._typeof( arguments[i] ) == "string" ) {
          var tmp = document.createElement( "div" );
          tmp.innerHTML = arguments[i];
          nodes = nodes.concat( Array.prototype.slice.call( tmp.childNodes ) );
        } else {
          nodes = nodes.concat( arguments[i] );
        }
      }
      return nodes.length == 1 ? nodes[0] : nodes;
    },

    /**
     * toggle the presense of a css class name
     *  _toggleClass( <a class="foo"/>, "bar" ) => <a class="foo bar"/>
     *  _toggleClass( <a class="foo bar"/>, "bar" ) => <a class="foo"/>
     */
    _toggleClass: function( el, class_name ) {
      var class_names = el.className.split( " " );
      if( class_names.indexOf( class_name ) >= 0 ) {
        class_names = class_names.filter( function( val ) {
          return val.toLowerCase() !== class_name.toLowerCase();
        } );
      } else {
        class_names.push( class_name );
      }

      el.className = class_names.join( " " );
    },

    /**
     * a slightly more informative "typeof"
     *  _typeof( [] ) => "array"
     *  _typeof( 1 ) => "number"
     *  etc.
     */
    _typeof: function( obj ) {
      if( obj === null ) {
        return "null";
      } else if( Object.prototype.toString.call( obj ) === "[object Array]" ) {
        return "array";
      } else {
        return typeof obj;
      }
    },

    /**
     * inject css rules into the document
     *  addStyle( "a { color: blue; }" )
     */
    addStyle: function( css ) {
      var style = formatJSON._html( '<style type="text/css"/>' );
      style.innerHTML = css;
      document.body.appendChild( style );
    },

    /**
     * add the toolbar
     */
    addToolbar: function( html ) {
      var toolbar = this._html( html );
      document.body.insertBefore( toolbar, document.body.firstChild );

      var toggle = document.getElementById( "toolbar" ).getElementsByTagName( "li" )[0];

      toggle.addEventListener( "click", function() {
        formatJSON._toggleClass( document.body, "before" );
      } );
    },

    /**
     * handle javascript events
     */
    handleEvents: function() {
      var disclosure_triangles = document.querySelectorAll( ".disclosure" ),

      handler = function( e ) {
        formatJSON._toggleClass( e.target.parentElement, "closed" );
      };

      Array.prototype.forEach.call( disclosure_triangles, function( el ) {
        el.addEventListener( "click", handler );
      } );
    },

    /**
     * hide the unformatted JSON text.
     * add a wrapper for the formatted JSON.
     */
    preparePage: function() {
      var json = document.body.textContent;
      document.body.innerHTML = "";

      this._append( document.body, [
        this._html( '<div id="before"></div>' ),
        this._html( '<div id="after"></div>' ),
      ] );

      document.getElementById( "before" ).innerText = json;
    },

    /**
     * render an array as HTML
     *  renderArray( [] ) => Element
     */
    renderArray: function( a ) {
      var list = this._html( '<ol start="0" class="value"/>' );

      for( var i = 0, ii = a.length; i < ii; i++ ) {
        this._append( list, this._append( this._html( "<li/>" ), this.render( a[i] ) ) );
      }

      return this._append(
        this._html( '<div class="array collapsible"/>' ),
          this._html(
            '<span class="disclosure"></span>',
            '<span class="decorator">[</span>',
            list.childNodes.length ? list : '',
            '<span class="decorator">]</span>', '<span class="separator">,</span>'
          )
        );
    },

    /**
     * render an object as HTML
     *  renderObject( {} ) => Element
     */
    renderObject: function( obj ) {
      var keys = [], list = this._html( '<dl class="value"/>' );

      // gather keys for sorting
      for( var i in obj ) {
        keys.push( i );
      }
      if( settings.sort_keys ) {
        keys = keys.sort();
      }

      for( var i = 0, ii = keys.length; i < ii; i++ ) {
        this._append( list, this._append( this._html( "<dt/>" ), this._html( '<span class="decorator">"</span>', document.createTextNode( keys[i] ), '<span class="decorator">"</span>', '<span class="delimiter">:</span>' ) ) );
        this._append( list, this._append( this._html( "<dd/>" ), this.render( obj[keys[i]] ) ) );
      }

      return this._append(
        this._html( '<div class="object collapsible"/>' ),
          this._html(
            '<span class="disclosure"></span>',
            '<span class="decorator">{</span>',
            list.childNodes.length ? list : '',
            '<span class="decorator">}</span>',
            '<span class="separator">,</span>'
          )
        );
    },

    /**
     * render a javascript object as JSON
     */
    renderRoot: function( obj ) {
      this._append( document.getElementById( "after" ), this.render( obj ) );
    },

    /**
     * render a javascript string as JSON
     */
    renderString: function( obj ) {
      var collapsible = obj.length > parseInt( settings.long_string_length, 10 ),
          collapsed = collapsible && settings.fold_strings,
          class_names = ["string"];

      if( collapsible ) { class_names.push( "collapsible" ); }
      if( collapsed ) { class_names.push( "closed" ); }

      return this._append(
        this._html( '<div class="' + class_names.join( " " ) + '"/>' ),
          this._html(
            collapsible ? '<span class="disclosure"></span>' : '',
            '<span class="decorator">"</span>',
            this._append( this._html( '<span class="value"/>' ), document.createTextNode( obj ) ),
            '<span class="decorator">"</span>',
            '<span class="separator">,</span>'
          )
        );
    },

    /**
     * render a literal value as HTML
     *  renderValue( true ) => Element
     */
    renderValue: function( l ) {
      var val = document.createTextNode( l );
      return this._append( this._append( this._html( '<span class="value"/>' ), val ), this._html( '<span class="separator">,</span>' ) );
    },

    /**
     * render a javascript variable as HTML
     *  render( foo ) => Element
     */
    render: function( obj ) {
      var t = this._typeof( obj );
      switch( t ) {
        case "array":  return this.renderArray( obj );
        case "object": return this.renderObject( obj );
        case "string": return this.renderString( obj );
        case "boolean":
        case "null":
        case "number":
          var el = this.renderValue( obj );
          el.className += " " + t;
          return el;
      }
    }
  };

  // initialize!
  formatJSON.init();
}() );
