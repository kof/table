/*
 * jQuery UI Table @VERSION
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/table
 *
 * Depends:
 *   jquery.ui.core.js
 *   jquery.ui.widget.js
 */
(function( $ ) {
    

var _super = $.Widget.prototype,
    classes = {
        widget: "ui-table",
        base: "ui-table ui-widget ui-widget-content ui-corner-all",
        inner: "ui-table-cell-inner"
    },
    undefined;    

$.widget( "ui.table", {
    version: "@VERSION",
    options: {
        columns: null,
        data: null,
        width: "100%",
        height: "100%",
        type: "text",
        speed: 300,
        classes: classes
    },
    
    _create: function() {
        var o = this.options;
        
        if ( !o.columns || !o.data ) {
            return;
        } 
            
        this.originalHtml = this.element.html();
        this.originalData = o.data;
        
        this.dataIndexHash = {};
        for ( var i = 0; i < o.columns.length; ++i ) {
            this.dataIndexHash[o.columns[i].dataIndex] = o.columns[i];
        }
        
        this.head = $( "<div class='" + classes.widget + "-head'></div>" ).appendTo( this.element );
        this.body = $( "<div class='" + classes.widget + "-body'></div>" ).appendTo( this.element );
        
        this.element
            .addClass( classes.base )
            .attr( "role", "table" )
            .css({
                width: o.width,
                height: o.height
            });
            
        // use innerHTML to get better performance
        this.head[0].innerHTML = tmpl( headTemplate, {
            columns: o.columns,
            classes: classes
        });
        
        this.headHeight = this.head.outerHeight();
        this._updateBody( o.data );
   },
    
    destroy: function() {
        this.element
            .removeClass( classes.base )
            .removeAttr( "role" )
            .html( this.originalHtml );
            
        _super.destroy.apply( this, arguments );
    },
         
    _setOption: function( key, value ) {
        _super._setOption.apply( this, arguments );

        var o = this.options;
        
        switch ( key ) {
            case "data":
                this.originalData = value;
                this._trigger( "datachange", null, {
                    data: o.data,
                    columns: o.columns
                });
                break;
            case "width":
                this.element.width( o.width );
                this._setDimensions();
                this._trigger( "resize", null, {width: o.width, height: o.height} );
                break;
            case "height":
                this.element.height( o.height );
                this._setDimensions();
                this._trigger( "resize", null, {width: o.width, height: o.height} );
                break;

        }
    },     
    
    update: function( data ) {
        if ( data ) {
            this._setOption( "data", data );
        }
        this._updateBody( data );
    },     
    
    scrollToRow: function( nr, speed, easing, callback ) {
        var o = this.options;
        
        if ( nr < 0 ) {
            nr = 0;
        } else if ( nr > o.data.length-1 ) {
            nr = o.data.length-1;
        }

        var offsetTop = this.body.find( "tr:eq(" + nr + ")" )[0].offsetTop;
        
        this.body.animate(
            {scrollTop: offsetTop}, 
            speed || o.speed, 
            easing, 
            callback
        );
    },
    
    filter: function( value, columns, caseSensitive ) {
        var o = this.options;
        o.data = value !== undefined && columns ? this.find.apply( this, arguments ) : this.originalData;
        this._updateBody( o.data );
    },
    
    // remove a row by index
    remove: function( index ) {
        this.originalData.splice( index, 1 );
        $( '#' + classes.widget + '-row-' + index ).remove();        
    },

    find: function( value, columns, caseSensitive ) {
        if ( !caseSensitive && typeof value === "string" ) {
            value = value.toLowerCase();
        }
        
            // always search in original data array            
        var data = this.originalData,
            searchData = [],
            colName, row, cell,
            type, filterHandler,
            match;
            
        for ( var rowIndex = 0; rowIndex < data.length; ++rowIndex ) {
            for ( var i = 0; i < columns.length; ++i ) {
                colName = columns[i];
                row = data[rowIndex];
                cell = row[colName];                 
                if ( cell !== undefined ) {
                    type = this.dataIndexHash[colName].type;
                    filterHandler = this.dataIndexHash[colName].filterHandler;
                    
                    if ( type === "string" ) {
                        if ( !caseSensitive ) {
                            cell = cell.toLowerCase();
                        }
                        if ( cell.indexOf( value ) >= 0 ) {
                            match = true;
                        }
                    } else if ( type === "number" ) {
                        value = parseInt( value ); 
                        if ( cell === value ) {
                            match = true;
                        }       
                    } else if ( type === "boolean" ) {
                        if ( cell === value ) {
                            match = true;
                        }       
                    } else if ( filterHandler  ) {
                        if ( filterHandler( value, row, rowIndex ) ) {
                            match = true;
                        }
                    }                    
                    
                    if ( match ) {
                        searchData.push( row );
                        match = false;
                        break;
                    }

                }
            }    
        }           

        return searchData;     
    },
    
    _updateBody: function( data ) {
        // don't use .html to get more performance       
        this.body[0].innerHTML = tmpl( bodyTemplate, {
            data: data,
            classes: classes,
            dataIndexHash: this.dataIndexHash
        });

        this.bodyTable = this.body.children( "table" );
        this.ths = this.head.find( "th" );
        this.tds = this.body.find( "tr:first td" );

        this._setDimensions();
    },     
           
    _setDimensions: function() {
        var o = this.options;
        
        this.width = this.body.width();
        this.height = this.element.height();
        this.bodyHeight = this.height - this.headHeight;
        this.bodyTableHeight = this.bodyTable.height();
        var scrollBar = this.bodyHeight < this.bodyTableHeight;

        

        this.body.height( this.bodyHeight );  
        this.head.css( "marginRight", scrollBar ? scrollbarWidth() : 0 );
        this.bodyTable.width( scrollBar ? this.width - scrollbarWidth() : this.width );
        
        // we have to apply the width to tds and ths, because there are 2 tables
        for ( var i = 0, width; i < o.columns.length; ++i ) {
            width = o.columns[i].width;
            if ( width ) {
                this.tds.eq(i).add( this.ths.eq(i) ).width( width ); 
            }
        }

    }
});



var headTemplate = '\
    <table class="<%=classes.widget%>-head-table" cellspacing="0" cellpadding="0" border="0" width="100%">\
        <thead>\
            <tr>\
                <% for ( var i=0; i<columns.length; ++i) { %>\
                    <% if ( columns[i].visible !== false ) { %>\
                        <th role="columnheader" >\
                            <div class="<%=classes.inner%> <%=classes.widget%>-header" unselectable="on">\
                                <%=columns[i].header%>\
                            </div>\
                        </th>\
                    <% } %>\
                <% } %>\
            </tr>\
        </thead>\
    </table>\
';

var bodyTemplate = '\
    <table class="<%=classes.widget%>-body-table" cellspacing="0" cellpadding="0" border="0" role="grid">\
        <tbody>\
        <% for ( var rowIndex=0, tdi = 0; rowIndex<data.length; ++rowIndex) { %>\
            <tr role="row" id="<%=classes.widget%>-row-<%=rowIndex%>">\
            <% for ( var cell in data[rowIndex] ) { %>\
                <% if ( dataIndexHash[cell] && dataIndexHash[cell].visible !== false ) { %>\
                    <td class="<%=classes.widget%>-td-<%=(dataIndexHash[cell].id || tdi)%>" role="gridcell">\
                        <div class="<%=classes.inner%>">\
                             <%=(dataIndexHash[cell].renderer ? dataIndexHash[cell].renderer(data[rowIndex][cell], data[rowIndex], rowIndex) : data[rowIndex][cell])%>\
                        </div>\
                    </td>\
                    <% ++tdi; %>\
                <% } %>\
            <% } %>\
            <% tdi = 0; %>\
            </tr>\
        <% } %>\
        </tbody>\
    </table>\
';



/*
 * Detect system scrollbar width
 * this should be an extra widget or plugin
 */
var scrollbarWidth = (function(){
    var width;
    function scrollbarWidth() {
        if ( width ) 
            return width;
        
        var $parent = $('<div></div>')
                        .css({
                            width: 50,
                            height: 50,
                            overflow: 'hidden',
                            position: 'absolute',
                            top: -2000,
                            left: -2000
                        })
                        .appendTo('body');
                        
        var $child = $('<div style="height:100%;"/>')
                       .appendTo($parent);
                        
        var realWidth = $child.innerWidth();
                    
        $parent.css('overflow', 'scroll');
        
        width = realWidth - $child.innerWidth();    
        
        $parent.remove();
        return width;
    }   
    return scrollbarWidth; 
})();


/*
 * micro templating engine
 * can be replaced by new template engine from the core
 */
var tmpl = (function(){
    var cache = {};
    function tmpl(str, data) {
        var fn = !/\W/.test(str) ?
          cache[str] = cache[str] ||
            tmpl(document.getElementById(str).innerHTML) :
          new Function("obj",
            "var p=[],print=function(){p.push.apply(p,arguments);};" +
           
            "with(obj){p.push('" +
            str
              .replace(/[\r\t\n]/g, " ")
              .split("<%").join("\t")
              .replace(/((^|%>)[^\t]*)'/g, "$1\r")
              .replace(/\t=(.*?)%>/g, "',$1,'")
              .split("\t").join("');")
              .split("%>").join("p.push('")
              .split("\r").join("\\'")
          + "');}return p.join('');");
        return data ? fn( data ) : fn;
    }
    return tmpl;    
})()


})( jQuery );