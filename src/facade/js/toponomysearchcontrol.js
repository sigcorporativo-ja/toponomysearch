
/* eslint-disable */ 
/**
 * @module M/control/ToponomysearchControl
 */

import ToponomysearchImplControl from 'impl/toponomysearchcontrol';
import template from 'templates/toponomysearch';
import templateresults from 'templates/toponomysearchresults';
import * as xml2js from 'xml2js';

export default class ToponomysearchControl extends M.Control {

  /**
   * Name of this control
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  static get NAME() {
    return 'toponomysearch';
  }

  /**
   * Template for this controls
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  /*static get TEMPLATE() {
    return 'toponomysearch.html';
  }*/
  /**
   * Template for this controls
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  /*static get RESULTS_TEMPLATE() {
    return 'toponomysearchresults.html';
  }*/

  /**
   * Template for this controls
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  static get SEARCHING_CLASS() {
    return 'm-searching';
  }

  /**
   * Template for this controls
   * @const
   * @type {string}
   * @public
   * @api stable
   */
  static get HIDDEN_RESULTS_CLASS() {
    return 'hidden';
  }

  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {M.Control}
   * @api stable
   */
  constructor() {
    // 1. checks if the implementation can create PluginControl
    if (M.utils.isUndefined(ToponomysearchImplControl)) {
      M.exception('La implementación usada no puede crear controles ToponomysearchControl');
    }
    // 2. implementation of this control
    const impl = new ToponomysearchImplControl();
    super(impl, 'Toponomysearch');

    /**
    * Facade of the map
    * @private
    * @type {HTMLElement}
    */
   this.loadBtn_ = null;

   /**
   * Facade of the map
   * @private
   * @type {HTMLElement}
   */
   this.clearBtn_ = null;

   /**
   * Facade of the map
   * @private
   * @type {HTMLElement}
   */
   this.inputName_ = null;

   /**
   * Facade of the map
   * @private
   * @type {HTMLElement}
   */
   this.selectProvince_ = null;

   /**
    * Facade of the map
    * @private
    * @type {HTMLElement}
    */
   this.inputMunicipality_ = null;

   /**
    * Facade of the map
    * @private
    * @type {HTMLElement}
    */
   this.optionsInputs_ = null;

   /**
  * Facade of the map
  * @private
  * @type {HTMLElement}
  */
   this.searchUrl_ = "http://www.ideandalucia.es/wfs-nga/services";


   /**
    * Container of the control
    * @private
    * @type {HTMLElement}
    */
   this.element_ = null;

   /**
    * Container of the results
    * @private
    * @type {HTMLElement}
    */
   this.resultsContainer_ = null;

   /**
    * Container of the results to scroll
    * @private
    * @type {HTMLElement}
    */
   this.resultsScrollContainer_ = null;

   /**
    * Searching result
    * @private
    * @type {HTMLElement}
    */
   this.searchingResult_ = null;

   /**
    * Timestamp of the search to abort
    * old requests
    * @private
    * @type {Nunber}
    */
   this.searchTime_ = 0;

   /**
    * Results of the search
    * @private
    * @type {Array<Object>}
    */
   this.results_ = {};


   /**
    * Flag that indicates the scroll is up
    * shown
    * @private
    * @type {Boolean}
    */
   this.scrollIsUp_ = true;

   /**
    * Facade of the map
    * @private
    * @type {M.Map}
    */
   this.facadeMap_ = null;

   // Inicio solo las provincias de Andalucia
   this.provincias_ = ["Almería", "Cádiz", "Córdoba", "Granada", "Huelva", "Jaén", "Málaga", "Sevilla"];

   // FUNCIONES a eventos para poder eliminarlos después
   this.boundLoadLocation_ = evt => this.loadLocation(evt);
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  createView(map) {
    this.facadeMap_ = map;
    if (!M.template.compileSync) { // JGL: retrocompatibilidad Mapea4
      M.template.compileSync = (string, options) => {
        let templateCompiled;
        let templateVars = {};
        let parseToHtml;
        if (!M.utils.isUndefined(options)) {
          templateVars = M.utils.extends(templateVars, options.vars);
          parseToHtml = options.parseToHtml;
        }
        const templateFn = Handlebars.compile(string);
        const htmlText = templateFn(templateVars);
        if (parseToHtml !== false) {
          templateCompiled = M.utils.stringToHtml(htmlText);
        } else {
          templateCompiled = htmlText;
        }
        return templateCompiled;
      };
    }
    
    return new Promise((success, fail) => {
      const html = M.template.compileSync(template, {
        'vars': { provincias: this.provincias_ }
      });
      // Añadir código dependiente del DOM
      this.addEvents(html);
      success(html);
    });
  }

  /**
   * This function creates the view to the specified map
   *
   * @public
   * @function
   * @param {M.Map} map to add the control
   * @api stable
   */
  addEvents(html) {
    this.element_ = html;

    // Registro los input y botones
    this.loadBtn_ = html.querySelector('.buttons > button.load');
    this.clearBtn_ = html.querySelector('.buttons > button.clear');
    this.inputName_ = html.querySelector('.form div.name > input');
    this.selectProvince_ = html.querySelector('.form div.province > select');
    this.inputMunicipality_ = html.querySelector('.form div.municipality > input');
    this.optionsInputs_ = html.querySelectorAll('.form div.options > input');


    // Asigno las funciones a cada evento
    this.clearBtn_.addEventListener('click', (evt) => this.clearInputs());
    this.loadBtn_.addEventListener('click', (evt) => this.search());
    this.inputName_.addEventListener('keyup', (evt) => this.checkSearch(evt));
    this.inputMunicipality_.addEventListener('input', (evt) => this.checkButtons());
    this.selectProvince_.addEventListener('change', (evt) => this.checkButtons());

    // results container
    this.resultsContainer_ = this.element_.querySelector('div#m-toponomysearch-results');
    M.utils.enableTouchScroll(this.resultsContainer_);
    this.searchingResult_ = this.element_.querySelector('div#m-toponomysearch-results > div#m-searching-result');
  }

  /**
  * Habilita/Deshabilita los botones de carga y limpieza
  *
  * @memberof ToponomySearchControl
  */
 checkButtons() {
  this.clearBtn_.disabled = (M.utils.isNullOrEmpty(this.selectProvince_.value) && M.utils.isNullOrEmpty(this.inputMunicipality_.value)
    && M.utils.isNullOrEmpty(this.inputName_.value));
  this.loadBtn_.disabled = (this.inputName_.value.trim().length < 3);
}

checkSearch(evt) {
  if (evt.keyCode === 13) {
    if (evt.target.value.trim().length >= 3) {
      this.search();
    } else {
      M.dialog.error('Debe introducir una búsqueda de al menos 3 caracteres.');
    }
  }
  this.checkButtons();
}

/**
* Elimina los valores de los inputs y limpio la capa de features
*
* @memberof GoToControl
*/
clearInputs() {
  if (!M.utils.isNullOrEmpty(this.inputName_)) {
    this.inputName_.value = '';
  }
  if (!M.utils.isNullOrEmpty(this.selectProvince_)) {
    this.selectProvince_.value = '';
  }
  if (!M.utils.isNullOrEmpty(this.selectProvince_)) {
    this.inputMunicipality_.value = '';
  }
  if (!M.utils.isNullOrEmpty(this.optionsInputs_)) {
    // Ponemos el valor de Empienza por.. por defecto
    this.optionsInputs_.forEach((element) => {
      if (element.value == 'starts') {
        element.checked = true;
      }
    });
  }
  this.results_ = {};
  if (!M.utils.isNullOrEmpty(this.resultsContainer_)) {
    this.resultsContainer_.innerHTML = '';
  }
  this.checkButtons();
  //Limpia la capa de coordenadas
  this.facadeMap_.removePopup();
  this.getImpl().removePoints_();
}



/**
 * This function checks if an object is equals
 * to this control
 *
 * @private
 * @function
 */
search() {
  this.element_.classList.add(ToponomysearchControl.SEARCHING_CLASS);
  // Elimino los puntos anteriores si los hay
  if (this.getImpl().listPoints.length > 0) {
    this.getImpl().removePoints_();
  }
  this.searchTime_ = Date.now();
  let selectedOption;
  this.optionsInputs_.forEach((element) => {
    if (element.checked) {
      selectedOption = element.value;
    }
  });
  let name = (selectedOption == "starts") ? this.encodeHTML_(this.inputName_.value) + "*" : "*" + this.encodeHTML_(this.inputName_.value) + "*";
  let nameFilter = '<PropertyIsLike matchCase="false" wildCard="*" singleChar="." escape="!"><PropertyName>app:nombre</PropertyName><Literal>' + name + '</Literal></PropertyIsLike>';
  let provinceFilter = (M.utils.isNullOrEmpty(this.selectProvince_.value)) ? '' : '<PropertyIsEqualTo><PropertyName>app:provincia</PropertyName><Literal>' + this.encodeHTML_(this.selectProvince_.value) + '</Literal></PropertyIsEqualTo>';
  let municipalityfilter = '<PropertyIsLike matchCase="false" wildCard="*" singleChar="." escape="!"><PropertyName>app:municipio</PropertyName><Literal>*' + this.encodeHTML_(this.inputMunicipality_.value) + '*</Literal></PropertyIsLike>';
  let searchUrl = M.utils.addParameters(this.searchUrl_, {
    'VERSION': '1.1.0',
    'SERVICE': 'WFS',
    'REQUEST': 'GetFeature',
    'TYPENAME': 'app:Entidad',
    'Filter': '<Filter xmlns:ogc="http://www.opengis.net/ogc" xmlns:app="http://www.deegree.org/app" xmlns:gml="http://www.opengis.net/gml"><and>' + provinceFilter + municipalityfilter + nameFilter + '</and></Filter>',
    'NAMESPACE': 'xmlns(app=http://www.deegree.org/app)',
    'maxFeatures': 30
  });
  let localTime = this.searchTime_;

  /* Stores the current search time into a
  closure function. When the promise returns a
  value we compare the current search time
  (this.searchTime) and the saved search time of
  the request (searchTime parameter).
  If they are different then aborts the response */
  M.remote.get(searchUrl).then((response) => {
    // if it is the current search then show the results
    if (localTime === this.searchTime_) {
      // Parseamos xml a json
      xml2js.parseString(response.text, { explicitArray: false, normalizeTags: true, tagNameProcessors: [this.removeXMLTags_] }, (err, result) => {
        this.results_ = this.checkNestedJSON_(result, 'featurecollection', 'featuremember');
        if (!M.utils.isNullOrEmpty(this.results_) && !Array.isArray(this.results_)) {
          this.results_ = [this.results_];
        }
        this.showResults_();
        if (!M.utils.isNullOrEmpty(this.results_)) {
          this.getImpl().drawPoints(this.results_);
        }
        this.element_.classList.remove(ToponomysearchControl.SEARCHING_CLASS);
      });
    }
  });
}

/**
 * This function checks if an object is equals
 * to this control
 *
 * @private
 * @function
 */
showResults_() {
  const html = M.template.compileSync(templateresults, {
    'jsonp': true,
    'vars': { results: this.results_, query: this.inputName_.value }
  });

    this.resultsContainer_.classList.remove(ToponomysearchControl.HIDDEN_RESULTS_CLASS);
    let result;
    let results = this.resultsContainer_.querySelectorAll('.result');
    // Si ya hay resultados, elimino los eventos asociados
    if (!M.utils.isNullOrEmpty(this.results_)) {
      for (let i = 0, ilen = results.length; i < ilen; i++) {
        result = results.item(i);
        result.removeEventListener("click", this.boundLoadLocation_);
      }
    }

    this.resultsContainer_.innerHTML = html.innerHTML;
    this.resultsContainer_.appendChild(this.searchingResult_);

    // Asocio los eventos de click a cada resultado
    results = this.resultsContainer_.querySelectorAll('.result');
    for (let i = 0, ilen = results.length; i < ilen; i++) {
      let result = results.item(i);
      result.addEventListener("click", this.boundLoadLocation_);
    }

}

loadLocation(evt) {
  evt = (evt || window.event);
  let id = evt.target.dataset.id;
  this.getImpl().loadLocation(id);
}

/**
 * This function checks if an object is equals
 * to this control
 *
 * @function
 * @api stable
 */

equals(obj) {
  let equals = false;
  if (obj instanceof ToponomysearchControl) {
    equals = (this.name === obj.name);
  }
  return equals;
}

/**
 * Escapa los caracteres no ascii reemplazándolos por sus
 * entidades HTML equivalentes usando el valor numérico
 * @param {any} text
 * @returns
 * @memberof ToponomysearchControl
 */
encodeHTML_(text) {
  /* charCodeAt funciona hasta el carácter \xFFFF (65535) (BMP) para
   * caracteres por encima de ése se representan con 4 bytes y hay
   * que usar String.codePointAt()
   */
  let strEncoded = "";
  if (text) {
    for (let i = 0; i < text.length; i++) {
      let numCode = text.charCodeAt(i);
      if (numCode > 127) {
        //no es un carácter ASCII, lo codificamos
        let codePoint = text.codePointAt(i);
        if (numCode !== codePoint) {
          //estamos fuera del BMP, lo correcto es el codePoint
          numCode = codePoint;
          //fuera del BMP javascript usa 4 bytes, es decir
          //dos caracteres, por lo que nos saltamos el segundo
          i++;
        }
        strEncoded = strEncoded + "&#" + numCode + ";";
      } else {
        //carácter ASCII, lo dejamos tal cual
        strEncoded = strEncoded + text[i];
      }
    }
  }
  return strEncoded;
}

/**
* obj, level1, level2, ... levelN
*
* @returns
* @memberof CatalogSearchControl
*/
checkNestedJSON_() {
  let args = arguments;
  let obj = args[0];
  for (let i = 1; i < args.length; i++) {
    if (!obj || !obj.hasOwnProperty(args[i])) {
      return null;
    }
    obj = obj[args[i]];
  }
  return obj;
}

/**
 * Reemplaza los tags del parseo generado por xml2js
 *
 * @param {any} name
 * @returns
 * @memberof ToponomySearchControl
 */
removeXMLTags_(name) {
  name = name.replace("gml:", "");
  name = name.replace("app:", "");
  name = name.replace("wfs:", "");
  return name;
}

  // Add your own functions
}
