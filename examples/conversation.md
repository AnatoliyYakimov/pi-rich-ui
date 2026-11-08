# Example response

The baseline has less traffic than the burst. These are illustrative values, not live measurements.

<Box title="Traffic">
  <Row>
    <Metric label="Baseline" value={600} unit="RPS"/>
    <Metric label="Peak" value={6000} unit="RPS" tone="warning"/>
  </Row>
  <Bars><Bar label="Baseline" value={600}/><Bar label="Peak" value={6000} tone="warning"/></Bars>
</Box>

A single transaction can persist both the business update and the outbox row. Publication happens afterwards.

<Flow><Step>Request</Step><Step>Transaction</Step><Step>Outbox relay</Step><Step>Kafka</Step></Flow>

The fenced example below stays literal:

```jsx
<Box title="Example"><Text>Not rendered inside a code fence.</Text></Box>
```
