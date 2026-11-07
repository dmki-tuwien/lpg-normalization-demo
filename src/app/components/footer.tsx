import {STRINGS} from "@/app/strings";

export default function Footer() {
    return (<footer>
    ©&nbsp;{STRINGS.common.year}&nbsp;-&nbsp;
    <a href={"https://johannes.schrott.onl"} target={"__blank"}>Johannes Schrott</a>,&nbsp;
    <a href={"https://dmki-tuwien.github.io"} target={"__blank"}>DMKI Lab</a>,&nbsp;
    <a href={"https://tuwien.ac.at"} target={"__blank"}>TU Wien</a>
    <ul id={"legend"}>
        Legend for Visualization: 
        <li key={"legend-node"}><div style={{
            display: "inline-block",
            width: "30px",
            height:"15px",
            border: "solid",
            marginInlineEnd: "5px",
            backgroundColor: "#FBB360",
            borderWidth: "1px",
            borderColor: "#935610",
            borderRadius: "6px",
            verticalAlign: "text-bottom"
        }}>
        </div>Node</li>
        <li key={"legend-edge"}><div style={{
            display: "inline-block",
            width: "15px",
            height:"1px",
            border: "solid",
            borderWidth: "1px",
            borderColor: "#738091",
            borderRadius: "6px",
            verticalAlign: "middle"
        }}>
        </div><div style={{
            display: "inline-block",
            width: "30px",
            height:"15px",
            border: "solid",
            backgroundColor: "#ffffff",
            borderWidth: "1px",
            borderColor: "#738091",
            borderRadius: "6px",
            verticalAlign: "text-bottom"
        }}>
        </div><div style={{
            display: "inline-block",
            width: "15px",
            height:"1px",
            border: "solid",
            marginInlineEnd: "5px",
            borderWidth: "1px",
            borderColor: "#738091",
            borderRadius: "6px",
            verticalAlign: "middle"
        }}>
        </div>Edge</li>
        <li key={"legend-dependency"}><div style={{
            display: "inline-block",
            width: "25px",
            height:"8px",
            borderTop: "dashed",
            marginInlineEnd: "5px",
            borderTopWidth: "2px",
            borderTopColor: "#000000",
            verticalAlign: "text-bottom"
        }}></div>Dependency</li>
        {/*<li key={"legend-disclaimer"}>If more than 50 nodes are visualized, individual properties are not shown for performance reasons.</li>*/}
    </ul>
</footer>
    );
}