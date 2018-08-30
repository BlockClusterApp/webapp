import React from 'react';

import './Card.scss';

// Ref: https://github.com/amarofashion/react-credit-cards

class ReactCreditCards extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      type: {
        name: 'unknown',
        maxLength: 16,
      },
    };

  }

  render() {

    const issuer = this.props.network ? this.props.network.toLowerCase() : 'master';

    const { name, last4 } = this.props;


    return (
      <div key="Cards" className="rccs">
        <div
          className={[
            'rccs__card',
            `rccs__card--${issuer}`,
          ].join(' ').trim()}
        >
          <div className="rccs__card--front">
            <div className="rccs__card__background" />
            <div className="rccs__issuer" />
            <div
              className={[
                'rccs__number',
              ].join(' ').trim()}
            >
              {issuer === 'amex' ? `XXXX XXXXXX X${last4}` : issuer === 'dinersclub' ? `XXXX XXXXXX ${last4}` : `XXXX XXXX XXXX ${last4}`}
            </div>
            <div
              className={[
                'rccs__name',
                name ? 'rccs--filled' : '',
              ].join(' ').trim()}
            >
              {name}
            </div>
            <div
              className={[
                'rccs__expiry'
              ].join(' ').trim()}
            >
              <div className="rccs__expiry__valid">Valid Thru</div>
              <div className="rccs__expiry__value">XX/XX</div>
            </div>
            <div className="rccs__chip" />
          </div>
        </div>
      </div>
    );
  }
}

export default ReactCreditCards;
