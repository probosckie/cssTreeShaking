import React, { PropTypes, Component } from 'react';
import moment from 'moment';
import classnames from 'classnames';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import s from './styles.css';


class ReviewComp extends Component {
  constructor(){
    this.state = {
      loading:false
    }
  }

  render() {
    return ({
            this.state.loading &&
              <div className={s.loaderContainer}>
                <div className={classnames(s.loader,s.graphic)}>
                  <svg className={s.circular} viewBox="25 25 50 50">
                    <circle
                      r="20"
                      cx="50"
                      cy="50"
                      fill="none"
                      strokeWidth="2"
                      className={s.path}
                      strokeMiterlimit="10"
                    />
                  </svg>
                </div>
              </div>
          })
  }
}


export default withStyles(s)(ReviewComp);