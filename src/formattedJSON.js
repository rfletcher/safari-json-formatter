( function() {
  var settings = {}, formatJSON = {
    /**
     * attempt to reformat the current document as JSON
     *  TODO: examine the document's content-type (appears to be impossible)
     */
    init: function() {
      // attempt to parse the body as JSON
      try {
        var obj = JSON.parse( document.body.textContent
          .split( "\\" ).join( "\\\\" ) // double-up on escape sequences
          .split( '\\\"' ).join( "\\\\\"" ) // at this point quotes have been unescaped.  re-escape them.
        );
      } catch( e ) {
        // invalid JSON :(
        return;
      }

      // hide the unformatted JSON text
      document.body.innerHTML = "";

      // receive settings from proxy.html
      safari.self.addEventListener( "message", function( e ) {
        if( e.name === "setSettings" ) {
          settings = e.message;

          formatJSON.addStyle( settings.css );
          formatJSON.renderAsJSON( obj );
          formatJSON.handleEvents();
        }
      }, false );

      // ask proxy.html for settings
      safari.self.tab.dispatchMessage( "getSettings" );
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
     * handle javascript events
     */
    handleEvents: function() {
      var disclosure_triangles = document.querySelectorAll( ".disclosure" ),

      handler = function( e ) {
        var parent = e.target.parentElement;
        parent.className = parent.className.replace( /( closed)?$/, function( closed ) {
          return closed ? "" : " closed";
        } );
      };

      Array.prototype.forEach.call( disclosure_triangles, function( el ) {
        el.addEventListener( "click", handler );
      } );
    },

    /**
     * render an array as HTML
     *  renderArray( [] ) => Element
     */
    renderArray: function( a ) {
      var list = this._html( "<ol/>" );
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
     * render a javascript object as JSON
     */
    renderAsJSON: function( obj ) {
      this._append( document.body, this.render( obj ) )
    },

    /**
     * render an object as HTML
     *  renderObject( {} ) => Element
     */
    renderObject: function( obj ) {
      var keys = [], list = this._html( "<dl/>" );

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
     * render a literal value as HTML
     *  renderValue( "foo" ) => Element
     */
    renderValue: function( l, quote ) {
      var val = document.createTextNode( l );
      if( quote ) {
        val = this._html( '<span class="decorator">"</span>', val, '<span class="decorator">"</span>' );
      }
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
        case "boolean":
        case "null":
        case "number":
        case "string":
          var el = this.renderValue( obj, t == "string" );
          el.className += " " + t;
          return el;
      }
    }
  };

  // initialize!
  formatJSON.init();
}() )