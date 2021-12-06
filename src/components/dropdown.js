import * as React from "react"
import {DropdownButton, Dropdown} from 'react-bootstrap'


const BlogDropdown = () => {

    return (
        <DropdownButton id="dropdown-basic-button" title="Category">
            <Dropdown.Item href="#/action-1">Current Affairs</Dropdown.Item>
            <Dropdown.Item href="#/action-2">General Theory</Dropdown.Item>
            <Dropdown.Item href="#/action-3">Data</Dropdown.Item>
        </DropdownButton>
    )
}

export default BlogDropdown