/**
 * Copyright 2022 Sourcepole AG
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './style/TextInput.css';

class TextInput extends React.Component {
    static propTypes = {
        disabled: PropTypes.bool,
        multiline: PropTypes.bool,
        name: PropTypes.string,
        onChange: PropTypes.func,
        placeholder: PropTypes.string,
        readOnly: PropTypes.bool,
        required: PropTypes.bool,
        style: PropTypes.object,
        value: PropTypes.string
    };
    static defaultProps = {
        placeholder: ""
    };
    state = {
        value: "",
        valueRev: 0,
        curValue: "",
        changed: false
    };
    constructor(props) {
        super(props);
        this.skipNextCommitOnBlur = false;
        this.initialHeight = null;
        this.input = null;
        this.formEl = null;
    }
    static getDerivedStateFromProps(nextProps, state) {
        if (state.value !== nextProps.value) {
            return {
                value: nextProps.value,
                valueRev: state.valueRev + 1,
                curValue: nextProps.value || "",
                changed: false
            };
        }
        return null;
    }
    componentDidMount() {
        this.setDefaultValue(this.state.value, this.state.valueRev, -1);
    }
    componentDidUpdate(prevProps, prevState) {
        this.setDefaultValue(this.state.value, this.state.valueRev, prevState.valueRev);
    }
    setDefaultValue = (value, valueRev, prevValueRef) => {
        if (valueRev > prevValueRef) {
            this.input.innerHTML = value;
            // Move cursor to end
            if (this.input === document.activeElement) {
                const range = document.createRange();
                range.selectNodeContents(this.input);
                range.collapse(false);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    };
    render() {
        const className = classNames({
            "text-input": true,
            "text-input-disabled": this.props.disabled,
            "text-input-readonly": this.props.readOnly || !this.state.curValue
        });
        return (
            <div className="text-input-wrapper">
                {this.props.name ? (
                    <textarea
                        className="text-input-form-el"
                        name={this.props.name}
                        onChange={() => {}}
                        ref={el => {this.formEl = el; }}
                        required={this.props.required}
                        value={this.props.value} />
                ) : null}
                <pre
                    className={className}
                    contentEditable={!this.props.disabled && !this.props.readOnly}
                    onBlur={this.onBlur}
                    onChange={this.onChange}
                    onInput={this.onChange}
                    onKeyDown={this.onKeyDown}
                    ref={el => {this.input = el;}}
                    style={this.props.style}
                />
                {!this.state.curValue ? (
                    <div className="text-input-placeholder">{this.props.placeholder}</div>
                ) : null}
                {this.props.multiline ? (
                    <div
                        className="text-input-resize-handle"
                        onMouseDown={this.startResize} />
                ) : null}
            </div>
        );
    }
    onChange = (ev) => {
        this.setState({curValue: ev.target.innerHTML.replace(/<br\s*\/?>$/, ''), changed: true});
    };
    onBlur = () => {
        if (!this.skipNextCommitOnBlur) {
            this.commit();
        }
    };
    onKeyDown = (ev) => {
        if (ev.keyCode === 17) { // Ctrl
            const prevValue = this.input.contentEditable;
            this.input.contentEditable = false;
            window.addEventListener("keyup", () => {
                this.input.contentEditable = prevValue;
            }, {once: true});
        } else if (ev.keyCode === 13 && !this.props.multiline) { // Enter
            ev.preventDefault();
            this.commit();
        } else if (ev.keyCode === 27) { // Esc
            this.setState((state) => ({
                value: this.props.value,
                valueRev: state.valueRev + 1,
                curValue: this.props.value || "",
                changed: false
            }));
            this.skipNextCommitOnBlur = true;
            ev.target.blur();
        }
    };
    commit = () => {
        if (this.state.changed) {
            this.props.onChange(this.state.curValue);
            if (this.formEl.form) {
                // https://stackoverflow.com/a/46012210
                const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                nativeSet.call(this.formEl, this.state.curValue);
                this.formEl.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    };
    startResize = (ev) => {
        const input = ev.target.previousElementSibling;
        if (!input) {
            return;
        }
        const startHeight = input.offsetHeight;
        if (this.initialHeight === null) {
            this.initialHeight = startHeight;
        }
        const startMouseY = ev.clientY;
        const resizeInput = (event) => {
            input.style.height = Math.max(this.initialHeight, (startHeight + (event.clientY - startMouseY))) + 'px';
        };
        document.body.style.userSelect = 'none';
        window.addEventListener("mousemove", resizeInput);
        window.addEventListener("mouseup", () => {
            document.body.style.userSelect = '';
            window.removeEventListener("mousemove", resizeInput);
        }, {once: true});
    };
}

export default TextInput;
