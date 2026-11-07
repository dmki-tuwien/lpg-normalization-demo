'use client'
import {
    Alignment,
    AnchorButton,
    Button, Icon,
    Navbar,
    NavbarDivider,
    NavbarGroup,
    NavbarHeading, Tooltip
} from "@blueprintjs/core";
import Image from "next/image";
import logo from '../../../public/logo.png';
import { STRINGS } from "../strings";


interface NavBarProps {
    onReset: () => void;
    setShowLogs: (val: boolean) => void;
    setShowSettings: (val: boolean) => void;
}

/**
 * Renders the navigation bar containing the application logo, a reset button, and a link to the web apps user documentation.
 * @param {Function} onReset Callback function for the reset button.
 * @param {Function} showLogs Callback function for the show logs button.
 * @return {JSX.Element} The rendered navigation bar component.
 */
export default function NavBar({ onReset, setShowLogs, setShowSettings }: NavBarProps) {
    return (
        <nav>
            <Navbar fixedToTop>
                <NavbarGroup align={Alignment.START}>
                    <Image src={logo} alt={"The logo of "+STRINGS.common.appName+": A piece of cheese together with grain"} height={23} style={{marginRight: "0.6em"}}></Image>
                    <NavbarHeading>{STRINGS.common.appName}</NavbarHeading>
                    <NavbarDivider/>
                    <Button className="bp6-minimal" icon="reset" text={STRINGS.navbar.reset} type="reset" onClick={onReset} />
                    <Tooltip lazy={true} usePortal={false} content={STRINGS.navbar.resetTooltip}><Icon icon="small-info-sign" /></Tooltip>
                </NavbarGroup>
                <NavbarGroup align={Alignment.END}>
                    <Button className="bp6-minimal" icon="settings" text={STRINGS.navbar.settings}  onClick={() => setShowSettings(true)} />
                    <Button className="bp6-minimal" icon="history" text={STRINGS.navbar.logs}  onClick={() => setShowLogs(true)} />
                    <NavbarDivider/>
                    <AnchorButton className="bp6-minimal" endIcon="share" text={STRINGS.navbar.documentation} href={STRINGS.documentation.mainUrl} target="_blank"/>
                </NavbarGroup>
            </Navbar>
        </nav>
    );
}