import React from 'react';
import PropTypes from 'prop-types';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import XMLToReact from '../src/XMLToReact';
import * as helpers from '../src/helpers';

configure({ adapter: new Adapter() });

describe('XMLToReact class ', () => {
  const TestComponent = ({ fancy, children }) => {
    const className = fancy ? 'test fancy' : 'test';
    return React.createElement('div', { className }, children);
  };

  TestComponent.propTypes = {
    fancy: PropTypes.bool,
    children: PropTypes.arrayOf(PropTypes.node),
  };

  TestComponent.defaultProps = {
    children: null,
    fancy: false,
  };

  const converters = {
    'test-tag': attributes => ({
      type: TestComponent,
      props: attributes,
    }),
    'fancy-test-tag': attributes => ({
      type: TestComponent,
      props: Object.assign({}, attributes, { fancy: true }),
    }),
  };

  const mockData = {
    name: 'Simba',
    job: 'King',
  };

  it('exports a module', () => {
    expect(typeof XMLToReact).toBe('function');
  });

  describe('#constructor', () => {
    it('returns an XMLToReact instance', () => {
      expect(new XMLToReact(converters)).toBeInstanceOf(XMLToReact);
    });

    [123, false, true, {}, [], null, undefined]
      .forEach((badConverters) => {
        it(`returns an XMLToReact instance with invalid converters (${typeof badConverters} -- ${badConverters})`, () => {
          const fn = () => new XMLToReact(badConverters);
          expect(fn).toThrow(Error);
        });
      });
  });

  describe('#convert', () => {
    let visitNodeSpy;

    beforeAll(() => {
      visitNodeSpy = jest.spyOn(helpers, 'visitNode');
    });

    beforeEach(() => {
      visitNodeSpy.mockClear();
    });

    afterAll(() => {
      visitNodeSpy.mockReset();
      visitNodeSpy.mockRestore();
    });

    [123, false, true, {}, [], null, undefined]
      .forEach((badXML) => {
        it(`returns null when XML input is not a string (${typeof badXML} -- ${badXML})`, () => {
          const xmltoreact = new XMLToReact(converters);
          const tree = xmltoreact.convert(badXML);

          expect(tree).toEqual(null);
          expect(visitNodeSpy).not.toHaveBeenCalled();
        });
      });

    ['', '< test-tag />', '</test-tag', '<1234>', '<test-tag']
      .forEach((badXML) => {
        it(`returns null tree when input is invalid XML "${badXML}"`, () => {
          const xmltoreact = new XMLToReact(converters);
          const tree = xmltoreact.convert(badXML);

          expect(tree).toEqual(null);
          expect(visitNodeSpy).not.toHaveBeenCalled();
        });
      });

    it('returns null for with valid XML tags which do not have an associated converter', () => {
      const xmltoreact = new XMLToReact(converters);
      const mockXML = '<fake-tag />';

      const tree = xmltoreact.convert(mockXML);

      expect(tree).toEqual(null);
      expect(visitNodeSpy).toHaveBeenCalled();
    });

    it('returns a React element tree with valid, simple XML without data', () => {
      const xmltoreact = new XMLToReact(converters);
      const mockXML = '<test-tag />';

      const tree = xmltoreact.convert(mockXML);

      expect(tree).not.toEqual(null);
      expect(visitNodeSpy).toHaveBeenCalled();

      const wrapper = shallow(tree);

      expect(wrapper.exists()).toEqual(true);
      expect(wrapper.find('.test')).toHaveLength(1);
    });


    it('returns a React element tree with valid, complex XML without data', () => {
      const xmltoreact = new XMLToReact(converters);
      const mockXML = `
        <test-tag>
          <fancy-test-tag />
        </test-tag>
      `;

      const tree = xmltoreact.convert(mockXML);

      expect(tree).not.toEqual(null);
      expect(visitNodeSpy).toHaveBeenCalled();

      const wrapper = shallow(tree);

      expect(wrapper.exists()).toEqual(true);
      expect(wrapper.find('.test > [fancy]')).toHaveLength(1);
    });

    it('returns a React element tree with valid XML and valid data', () => {
      const xmltoreact = new XMLToReact(converters);
      const mockXML = '<test-tag />';
      const tree = xmltoreact.convert(mockXML, mockData);

      expect(tree).not.toEqual(null);
      expect(visitNodeSpy).toHaveBeenCalled();

      const wrapper = shallow(tree);

      expect(wrapper.exists()).toEqual(true);
      expect(wrapper.find('.test')).toHaveLength(1);
    });

    [123, false, true, {}, [], null, undefined]
      .forEach((badData) => {
        it(`returns a React element tree with valid XML, but with invalid data ${typeof badData} -- ${badData}`, () => {
          const xmltoreact = new XMLToReact(converters);
          const mockXML = '<test-tag />';
          const tree = xmltoreact.convert(mockXML, badData);

          expect(tree).not.toEqual(null);
          expect(visitNodeSpy).toHaveBeenCalled();

          const wrapper = shallow(tree);

          expect(wrapper.exists()).toEqual(true);
          expect(wrapper.find('.test')).toHaveLength(1);
        });
      });
  });
});
